from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository,RepositoryFile,ScanSnapshot
from app.schemas.test_relationships import TestRelationshipResponse
from app.services.scans import latest_ready
from app.services.test_relationships import relationships
router=APIRouter(prefix='/repositories/{repository_id}/files',tags=['test-relationships'])
def snapshot(db,repository_id,snapshot_id):
 if db.get(Repository,repository_id) is None: raise HTTPException(404,'Repository not found')
 value=latest_ready(db,repository_id) if snapshot_id is None else db.get(ScanSnapshot,snapshot_id)
 if value is None or value.repository_id!=repository_id or value.status!='ready': raise HTTPException(404,'No ready scan found')
 return value
@router.get('/{file_id}/tests',response_model=TestRelationshipResponse)
def source_tests(repository_id:int,file_id:int,snapshot_id:int|None=None,db:Session=Depends(get_db)):
 value=snapshot(db,repository_id,snapshot_id); file=db.get(RepositoryFile,file_id)
 if file is None or file.snapshot_id!=value.id or file.is_test: raise HTTPException(404,'Source file not found')
 return TestRelationshipResponse(snapshot_id=value.id,items=relationships(db,value.id,file_id,'source'))
@router.get('/{file_id}/tested-sources',response_model=TestRelationshipResponse)
def test_sources(repository_id:int,file_id:int,snapshot_id:int|None=None,db:Session=Depends(get_db)):
 value=snapshot(db,repository_id,snapshot_id); file=db.get(RepositoryFile,file_id)
 if file is None or file.snapshot_id!=value.id or not file.is_test: raise HTTPException(404,'Test file not found')
 return TestRelationshipResponse(snapshot_id=value.id,items=relationships(db,value.id,file_id,'test'))
