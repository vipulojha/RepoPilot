from pathlib import Path
from fastapi.testclient import TestClient
from app.db.database import Base, get_db
from app.main import app

def test_graph_direction_depth_and_limits(tmp_path: Path):
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
        repo=client.post('/api/v1/repositories',json={'name':'graph','path':str(root)}).json(); client.post(f"/api/v1/repositories/{repo['id']}/scans",json={}); files=client.get(f"/api/v1/repositories/{repo['id']}/files?limit=10").json()['items']; c=next(x for x in files if x['name']=='c.ts');
        outgoing=client.get(f"/api/v1/repositories/{repo['id']}/graph",params={'root_file_id':c['id'],'direction':'outgoing','depth':1}).json(); assert outgoing['node_count']==1
        incoming=client.get(f"/api/v1/repositories/{repo['id']}/graph",params={'root_file_id':c['id'],'direction':'incoming','depth':2}).json(); assert {n['path'] for n in incoming['nodes']} == {'a.ts','b.ts','c.ts'}; assert incoming['edge_count']==2
        limited=client.get(f"/api/v1/repositories/{repo['id']}/graph",params={'root_file_id':c['id'],'direction':'incoming','depth':2,'max_nodes':2}).json(); assert limited['truncated'] is True
        repository_graph=client.get(f"/api/v1/repositories/{repo['id']}/graph").json(); assert repository_graph['node_count']==3; assert repository_graph['edge_count']==2
    app.dependency_overrides.clear()
