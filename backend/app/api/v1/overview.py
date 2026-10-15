from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import func,select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Dependency,Repository,RepositoryFile,ScanSnapshot,Symbol
from app.schemas.overview import OverviewResponse
from app.services.hotspots import calculate_hotspots
from app.services.scans import latest_ready
router=APIRouter(prefix='/repositories/{repository_id}/overview',tags=['overview'])
@router.get('',response_model=OverviewResponse)
def overview(repository_id:int,snapshot_id:int|None=None,db:Session=Depends(get_db)):
 if db.get(Repository,repository_id) is None: raise HTTPException(404,'Repository not found')
 snapshot=latest_ready(db,repository_id) if snapshot_id is None else db.get(ScanSnapshot,snapshot_id)
 if snapshot is None or snapshot.repository_id!=repository_id or snapshot.status!='ready': raise HTTPException(404,'No ready scan found')
 files=db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id==snapshot.id)).all(); symbols=db.scalar(select(func.count(Symbol.id)).where(Symbol.snapshot_id==snapshot.id)) or 0; deps=db.scalar(select(func.count(Dependency.id)).where(Dependency.snapshot_id==snapshot.id,Dependency.resolution_status=='internal')) or 0
 return OverviewResponse(snapshot_id=snapshot.id,file_count=len(files),total_lines=sum(file.line_count or 0 for file in files),total_bytes=sum(file.size_bytes for file in files),symbol_count=symbols,dependency_count=deps,test_file_count=sum(file.is_test for file in files),language_counts={language:sum(file.language==language for file in files) for language in sorted({file.language for file in files})},warning_count=snapshot.warning_count,hotspot_count=len(calculate_hotspots(db,snapshot.id)))
