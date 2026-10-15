from pathlib import Path

from fastapi.testclient import TestClient

from app.db.database import Base, get_db
from app.main import app


def test_symbols_are_snapshot_scoped(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    root = tmp_path / "repo"; root.mkdir(); (root / "user.py").write_text("class User:\n    def get(self): pass\n")
    engine = create_engine(f"sqlite:///{tmp_path / 'db.sqlite'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine); sessions = sessionmaker(bind=engine, expire_on_commit=False)
    def override_db():
        db = sessions()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        repo = client.post('/api/v1/repositories', json={'name':'symbols','path':str(root)}).json()
        scan = client.post(f"/api/v1/repositories/{repo['id']}/scans", json={}).json()
        response = client.get(f"/api/v1/repositories/{repo['id']}/symbols")
        assert response.status_code == 200
        assert {item['qualified_name'] for item in response.json()['items']} == {'User', 'User.get'}
        assert next(item for item in response.json()['items'] if item['qualified_name'] == 'User.get')['parent_symbol_id'] is not None
        assert response.json()['snapshot_id'] == scan['id']
    app.dependency_overrides.clear()
