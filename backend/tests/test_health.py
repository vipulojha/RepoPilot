from fastapi.testclient import TestClient

from app.config import get_settings
from app.db.database import Base, get_db
from app.main import app


def client_with_database(tmp_path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_local = sessionmaker(bind=engine, expire_on_commit=False)

    def override_db():
        db = session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "repopilot", "version": get_settings().app_version}


def test_repository_registration_and_lookup(tmp_path):
    client = client_with_database(tmp_path)
    payload = {"name": "example-repo", "path": "/workspace/repo", "branch": "main"}
    created = client.post("/api/v1/repositories", json=payload)
    assert created.status_code == 201
    repository = created.json()
    assert repository["name"] == "example-repo"
    assert client.get("/api/v1/repositories").json()["items"][0]["path"] == payload["path"]
    assert client.get(f"/api/v1/repositories/{repository['id']}").json()["branch"] == "main"
    app.dependency_overrides.clear()


def test_repository_validation_and_not_found(tmp_path):
    client = client_with_database(tmp_path)
    assert client.post("/api/v1/repositories", json={"name": ""}).status_code == 422
    assert client.get("/api/v1/repositories/999").status_code == 404
    app.dependency_overrides.clear()


def test_duplicate_repository_returns_conflict(tmp_path):
    client = client_with_database(tmp_path)
    payload = {"name": "one", "path": "/workspace/repo"}
    assert client.post("/api/v1/repositories", json=payload).status_code == 201
    assert client.post("/api/v1/repositories", json=payload).status_code == 409
    app.dependency_overrides.clear()
