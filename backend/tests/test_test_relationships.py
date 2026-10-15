from pathlib import Path
from fastapi.testclient import TestClient
from app.db.database import Base,get_db
from app.main import app

def test_direct_and_naming_test_relationships(tmp_path:Path):
 from sqlalchemy import create_engine
 from sqlalchemy.orm import sessionmaker
 root=tmp_path/'repo';root.mkdir();(root/'tests').mkdir();(root/'user.py').write_text('class User: pass\n');(root/'tests'/'test_user.py').write_text('from user import User\n');(root/'orphan.test.py').write_text('assert True\n')
 engine=create_engine(f"sqlite:///{tmp_path/'db.sqlite'}",connect_args={'check_same_thread':False});Base.metadata.create_all(engine);sessions=sessionmaker(bind=engine,expire_on_commit=False)
 def override_db():
  db=sessions()
  try:yield db
  finally:db.close()
 app.dependency_overrides[get_db]=override_db
 with TestClient(app) as client:
  repo=client.post('/api/v1/repositories',json={'name':'tests','path':str(root)}).json();client.post(f"/api/v1/repositories/{repo['id']}/scans",json={});files=client.get(f"/api/v1/repositories/{repo['id']}/files?limit=20").json()['items'];source=next(x for x in files if x['name']=='user.py');test=next(x for x in files if x['name']=='test_user.py');
  related=client.get(f"/api/v1/repositories/{repo['id']}/files/{source['id']}/tests").json()['items'];assert related[0]['kind']=='direct_dependency';assert client.get(f"/api/v1/repositories/{repo['id']}/files/{test['id']}/tested-sources").json()['items'][0]['source_file_id']==source['id']
 app.dependency_overrides.clear()
