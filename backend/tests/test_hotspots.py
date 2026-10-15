from pathlib import Path
from fastapi.testclient import TestClient
from app.db.database import Base,get_db
from app.main import app

def test_hotspots_are_bounded_deterministic_and_explainable(tmp_path:Path):
 from sqlalchemy import create_engine
 from sqlalchemy.orm import sessionmaker
 root=tmp_path/'repo';root.mkdir();(root/'c.ts').write_text('export const c=1');(root/'b.ts').write_text("import './c';\n"*3);(root/'a.ts').write_text("import './b';\n")
 engine=create_engine(f"sqlite:///{tmp_path/'db.sqlite'}",connect_args={'check_same_thread':False});Base.metadata.create_all(engine);sessions=sessionmaker(bind=engine,expire_on_commit=False)
 def override_db():
  db=sessions()
  try:yield db
  finally:db.close()
 app.dependency_overrides[get_db]=override_db
 with TestClient(app) as client:
  repo=client.post('/api/v1/repositories',json={'name':'hot','path':str(root)}).json();client.post(f"/api/v1/repositories/{repo['id']}/scans",json={}); response=client.get(f"/api/v1/repositories/{repo['id']}/hotspots"); data=response.json()
  assert response.status_code==200;assert len(data['items'])==3;assert all(0<=item['score']<=100 for item in data['items']);assert all(item['reasons'] for item in data['items']);assert [item['rank'] for item in data['items']]==[1,2,3]
 app.dependency_overrides.clear()
