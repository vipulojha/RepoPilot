from pathlib import Path
from fastapi.testclient import TestClient
from app.db.database import Base,get_db
from app.main import app
def test_overview_uses_ready_snapshot(tmp_path:Path):
 from sqlalchemy import create_engine
 from sqlalchemy.orm import sessionmaker
 root=tmp_path/'repo';root.mkdir();(root/'main.py').write_text('print(1)\n')
 engine=create_engine(f"sqlite:///{tmp_path/'db.sqlite'}",connect_args={'check_same_thread':False});Base.metadata.create_all(engine);sessions=sessionmaker(bind=engine,expire_on_commit=False)
 def override_db():
  db=sessions()
  try:yield db
  finally:db.close()
 app.dependency_overrides[get_db]=override_db
 with TestClient(app) as client:
  repo=client.post('/api/v1/repositories',json={'name':'overview','path':str(root)}).json();client.post(f"/api/v1/repositories/{repo['id']}/scans",json={});data=client.get(f"/api/v1/repositories/{repo['id']}/overview").json();assert data['file_count']==1;assert data['language_counts']['Python']==1
 app.dependency_overrides.clear()
