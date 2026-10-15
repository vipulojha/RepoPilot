from pathlib import Path

from fastapi.testclient import TestClient

from app.db.database import Base, get_db
from app.main import app


def test_scan_and_files_api(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    root = tmp_path / "repo"
    root.mkdir()
    (root / "main.py").write_text("print('ok')\n")
    engine = create_engine(f"sqlite:///{tmp_path / 'db.sqlite'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, expire_on_commit=False)

    def override_db():
        db = sessions()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        repository = client.post("/api/v1/repositories", json={"name": "fixture", "path": str(root)}).json()
        scan = client.post(f"/api/v1/repositories/{repository['id']}/scans", json={}).json()
        assert scan["status"] == "ready"
        assert scan["statistics"]["file_count"] == 1
        files = client.get(f"/api/v1/repositories/{repository['id']}/files").json()
        assert files["items"][0]["relative_path"] == "main.py"
        tree = client.get(f"/api/v1/repositories/{repository['id']}/files/tree").json()
        assert tree["items"][0]["name"] == "main.py"
        assert client.get(f"/api/v1/repositories/{repository['id']}/scans/latest").status_code == 200
    app.dependency_overrides.clear()


def test_failed_scan_preserves_previous_ready_snapshot(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    root = tmp_path / "repo"
    root.mkdir()
    (root / "main.py").write_text("print('ok')\n")
    engine = create_engine(f"sqlite:///{tmp_path / 'db.sqlite'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, expire_on_commit=False)

    def override_db():
        db = sessions()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        repository = client.post("/api/v1/repositories", json={"name": "fixture", "path": str(root)}).json()
        first = client.post(f"/api/v1/repositories/{repository['id']}/scans", json={}).json()
        (root / "main.py").unlink()
        root.rmdir()
        failed = client.post(f"/api/v1/repositories/{repository['id']}/scans", json={}).json()
        assert failed["status"] == "failed"
        latest = client.get(f"/api/v1/repositories/{repository['id']}/scans/latest").json()
        assert latest["id"] == first["id"]
        assert latest["status"] == "ready"
    app.dependency_overrides.clear()
