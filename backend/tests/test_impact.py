from pathlib import Path
from fastapi.testclient import TestClient
from app.db.database import Base, get_db
from app.main import app

def test_direct_transitive_and_reverse_impact(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    root=tmp_path/'repo'; root.mkdir(); (root/'c.ts').write_text('export const c=1'); (root/'b.ts').write_text("import './c';"); (root/'a.ts').write_text("import './b';")
    engine=create_engine(f"sqlite:///{tmp_path/'db.sqlite'}",connect_args={'check_same_thread':False}); Base.metadata.create_all(engine); sessions=sessionmaker(bind=engine,expire_on_commit=False)
    def override_db():
        db=sessions()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db]=override_db
    with TestClient(app) as client:
        repo=client.post('/api/v1/repositories',json={'name':'impact','path':str(root)}).json(); client.post(f"/api/v1/repositories/{repo['id']}/scans",json={}); files=client.get(f"/api/v1/repositories/{repo['id']}/files?limit=10").json()['items']; c=next(x for x in files if x['name']=='c.ts'); result=client.post(f"/api/v1/repositories/{repo['id']}/impact",json={'changed_file_ids':[c['id']],'max_depth':2}).json()
        assert [x['path'] for x in result['affected_files']] == ['b.ts','a.ts']; assert [x['depth'] for x in result['affected_files']] == [1,2]; assert result['affected_files'][1]['dependency_path'][0]['path']=='c.ts'
    app.dependency_overrides.clear()

def test_impact_rejects_unknown_file(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    root=tmp_path/'repo'; root.mkdir(); (root/'a.py').write_text('x=1')
    engine=create_engine(f"sqlite:///{tmp_path/'db.sqlite'}",connect_args={'check_same_thread':False}); Base.metadata.create_all(engine); sessions=sessionmaker(bind=engine)
    def override_db():
        db=sessions()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db]=override_db
    with TestClient(app) as client:
        repo=client.post('/api/v1/repositories',json={'name':'impact','path':str(root)}).json(); client.post(f"/api/v1/repositories/{repo['id']}/scans",json={}); assert client.post(f"/api/v1/repositories/{repo['id']}/impact",json={'changed_file_ids':[999]}).status_code==404
    app.dependency_overrides.clear()

def test_impact_includes_static_test_validation(tmp_path: Path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    root=tmp_path/'repo'; root.mkdir(); (root/'tests').mkdir(); (root/'user.py').write_text('class User: pass\n'); (root/'tests'/'test_user.py').write_text('from user import User\n')
    engine=create_engine(f"sqlite:///{tmp_path/'db.sqlite'}",connect_args={'check_same_thread':False}); Base.metadata.create_all(engine); sessions=sessionmaker(bind=engine,expire_on_commit=False)
    def override_db():
        db=sessions()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db]=override_db
    with TestClient(app) as client:
        repo=client.post('/api/v1/repositories',json={'name':'impact-tests','path':str(root)}).json(); client.post(f"/api/v1/repositories/{repo['id']}/scans",json={}); files=client.get(f"/api/v1/repositories/{repo['id']}/files?limit=10").json()['items']; source=next(x for x in files if x['name']=='user.py')
        result=client.post(f"/api/v1/repositories/{repo['id']}/impact",json={'changed_file_ids':[source['id']]}).json()
        assert result['counts']['tests'] == 1
        assert result['test_validation'][0]['tag'] == 'STATIC LINKED'
        assert result['test_validation'][0]['status'] == 'Mapped'
        assert 'runtime execution' in result['test_validation'][0]['cases']
    app.dependency_overrides.clear()
