import subprocess
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import app


def test_scan_search_graph_impact_and_history_workflow(tmp_path: Path):
    root = tmp_path / "repo"
    root.mkdir()
    (root / "c.ts").write_text("export const c = 'needle';\n")
    (root / "b.ts").write_text("import './c';\n")
    (root / "a.ts").write_text("import './b';\n")
    subprocess.run(["git", "init", "-q"], cwd=root, check=True)
    subprocess.run(["git", "config", "user.name", "Integration Test"], cwd=root, check=True)
    subprocess.run(["git", "config", "user.email", "integration@example.invalid"], cwd=root, check=True)
    subprocess.run(["git", "add", "."], cwd=root, check=True)
    subprocess.run(["git", "commit", "-qm", "fixture"], cwd=root, check=True)
    (root / "c.ts").write_text("export const c = 'changed needle';\n")
    subprocess.run(["git", "add", "c.ts"], cwd=root, check=True)
    subprocess.run(["git", "commit", "-qm", "change c"], cwd=root, check=True)

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
    try:
        with TestClient(app) as client:
            repository = client.post("/api/v1/repositories", json={"name": "workflow", "path": str(root)}).json()
            repository_id = repository["id"]
            scan = client.post(f"/api/v1/repositories/{repository_id}/scans", json={}).json()
            assert scan["status"] == "ready"

            search = client.get(f"/api/v1/repositories/{repository_id}/search", params={"q": "needle"}).json()
            assert any(item["path"] == "c.ts" for item in search["items"])

            files = client.get(f"/api/v1/repositories/{repository_id}/files?limit=10").json()["items"]
            c_file = next(item for item in files if item["name"] == "c.ts")
            graph = client.get(f"/api/v1/repositories/{repository_id}/graph", params={"root_file_id": c_file["id"], "direction": "incoming", "depth": 2}).json()
            assert {node["path"] for node in graph["nodes"]} == {"a.ts", "b.ts", "c.ts"}

            impact = client.post(f"/api/v1/repositories/{repository_id}/impact", json={"changed_file_ids": [c_file["id"]], "max_depth": 2}).json()
            assert [item["path"] for item in impact["affected_files"]] == ["b.ts", "a.ts"]

            history = client.get(f"/api/v1/repositories/{repository_id}/git/history").json()
            assert [item["subject"] for item in history["items"][:2]] == ["change c", "fixture"]
    finally:
        app.dependency_overrides.clear()
