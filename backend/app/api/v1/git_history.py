from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.v1.router import get_repository
from app.db.database import get_db
from app.db.models import RepositoryFile
from app.services.scans import latest_ready
from app.services.history import GitHistoryService
from app.services.git import GitServiceError
from app.schemas.git import GitHistoryResponse, GitCommit, GitFileHistoryResponse, GitCompareResponse
router=APIRouter(prefix="/repositories",tags=["git"])
def call(fn):
    try: return fn()
    except GitServiceError as e: raise HTTPException(422,str(e)) from e
@router.get("/{repository_id}/git/history",response_model=GitHistoryResponse)
def history(repository_id:int,page:int=Query(1,ge=1,le=10000),limit:int=Query(50,ge=1,le=100),branch:str|None=None,db:Session=Depends(get_db)):
    r=get_repository(repository_id,db); return call(lambda:GitHistoryService().history(r.path,page,limit,branch))
@router.get("/{repository_id}/git/commits/{sha}",response_model=GitCommit)
def commit(repository_id:int,sha:str,db:Session=Depends(get_db)):
    r=get_repository(repository_id,db); return call(lambda:GitHistoryService().commit(r.path,sha))
@router.get("/{repository_id}/git/files/{file_id}/history",response_model=GitFileHistoryResponse)
def file_history(repository_id:int,file_id:int,page:int=Query(1,ge=1),limit:int=Query(50,ge=1,le=100),db:Session=Depends(get_db)):
    r=get_repository(repository_id,db); snap=latest_ready(db,repository_id)
    if not snap: raise HTTPException(404,"No ready scan found")
    f=db.scalar(select(RepositoryFile).where(RepositoryFile.id==file_id,RepositoryFile.snapshot_id==snap.id))
    if not f: raise HTTPException(404,"File not found")
    return call(lambda:GitHistoryService().file_history(r.path,file_id,f.relative_path,page,limit))
@router.get("/{repository_id}/git/compare",response_model=GitCompareResponse)
def compare(repository_id:int,base:str,head:str,db:Session=Depends(get_db)):
    r=get_repository(repository_id,db); return call(lambda:GitHistoryService().compare(r.path,base,head))
