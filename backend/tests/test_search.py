from pathlib import Path
from fastapi.testclient import TestClient
from app.db.database import Base, get_db
from app.main import app

def test_search_returns_code_and_symbol_hits(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    root = tmp_path / 'repo'; root.mkdir(); (root / 'user.py').write_text('class User:\n    def getUser(self): return 1\n')
    engine = create_engine(f"sqlite:///{tmp_path / 'db.sqlite'}", connect_args={'check_same_thread': False}); Base.metadata.create_all(engine); sessions = sessionmaker(bind=engine, expire_on_commit=False)
    def override_db():
        db = sessions()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        repo = client.post('/api/v1/repositories', json={'name':'search','path':str(root)}).json(); client.post(f"/api/v1/repositories/{repo['id']}/scans", json={})
        response = client.get(f"/api/v1/repositories/{repo['id']}/search", params={'q':'User'})
        assert response.status_code == 200
        assert {item['type'] for item in response.json()['items']} == {'code', 'symbol'}
        assert client.get(f"/api/v1/repositories/{repo['id']}/search", params={'q':'" OR NOT'}).status_code == 200
    app.dependency_overrides.clear()

def test_empty_search_is_validation_error(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(f"sqlite:///{tmp_path / 'db.sqlite'}", connect_args={'check_same_thread': False}); Base.metadata.create_all(engine); sessions = sessionmaker(bind=engine)
    def override_db():
        db = sessions()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        repo = client.post('/api/v1/repositories', json={'name':'search','path':str(tmp_path)}).json()
        assert client.get(f"/api/v1/repositories/{repo['id']}/search", params={'q':'   '}).status_code == 404
    app.dependency_overrides.clear()
