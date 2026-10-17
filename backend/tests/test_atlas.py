from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.db.models import Dependency, Repository, RepositoryFile, ScanSnapshot, Symbol
from app.main import app


def _client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'atlas.sqlite'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine, expire_on_commit=False)

    def override_db():
        db = sessions()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    return TestClient(app), sessions


def test_atlas_groups_deterministically_and_aggregates_real_metrics(tmp_path):
    client, sessions = _client(tmp_path)
    db = sessions()
    repo = Repository(name="atlas", path=str(tmp_path / "repo"))
    db.add(repo); db.flush()
    snapshot = ScanSnapshot(repository_id=repo.id, status="ready")
    db.add(snapshot); db.flush()
    files = []
    for path, is_test in [("frontend/src/views/b.py", False), ("backend/app/api/a.py", False), ("backend/app/api/test_a.py", True)]:
        file = RepositoryFile(snapshot_id=snapshot.id, relative_path=path, name=path.rsplit("/", 1)[-1], language="Python", classification="TEXT", line_count=20, is_test=is_test)
        db.add(file); db.flush(); files.append(file)
    db.add_all([
        Symbol(snapshot_id=snapshot.id, file_id=files[1].id, kind="function", name="a", qualified_name="a", start_line=1, start_column=0, end_line=2, end_column=1),
        Symbol(snapshot_id=snapshot.id, file_id=files[0].id, kind="function", name="b", qualified_name="b", start_line=1, start_column=0, end_line=2, end_column=1),
    ])
    db.add_all([
        Dependency(snapshot_id=snapshot.id, source_file_id=files[1].id, target_file_id=files[0].id, imported_name="b", kind="import", resolution_status="internal", source_line=1, source_column=0),
        Dependency(snapshot_id=snapshot.id, source_file_id=files[2].id, target_file_id=files[0].id, imported_name="b", kind="import", resolution_status="internal", source_line=1, source_column=0),
    ])
    db.commit(); db.close()
    try:
        response = client.get(f"/api/v1/repositories/{repo.id}/atlas")
        assert response.status_code == 200
        data = response.json()
        assert [region["path"] for region in data["regions"]] == ["backend", "frontend"]
        assert [module["path"] for module in data["modules"]] == ["backend/app/api", "frontend/src/views"]
        assert data["metrics"]["files"] == 3
        assert data["metrics"]["dependencies"] == 2
        assert data["metrics"]["test_relationships"] == 1
        assert data["modules"][0]["symbol_count"] == 1
        assert data["modules"][0]["test_files"] == 1
        assert len(data["edges"]) == 1
        assert data["edges"][0]["dependency_count"] == 2
        assert isinstance(data["edges"][0]["hotspot"], (int, float))
        assert any(file["hotspot_score"] > 0 for module in data["modules"] for file in module["files"])
    finally:
        app.dependency_overrides.clear()


def test_atlas_returns_404_without_ready_snapshot(tmp_path):
    client, sessions = _client(tmp_path)
    db = sessions(); repo = Repository(name="empty", path=str(tmp_path / "repo")); db.add(repo); db.commit(); repo_id = repo.id; db.close()
    try:
        response = client.get(f"/api/v1/repositories/{repo_id}/atlas")
        assert response.status_code == 404
        assert response.json()["detail"] == "No ready scan found"
    finally:
        app.dependency_overrides.clear()
