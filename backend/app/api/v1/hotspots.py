from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository, ScanSnapshot
from app.schemas.hotspots import HotspotListResponse
from app.services.hotspots import calculate_hotspots
from app.services.scans import latest_ready

router=APIRouter(prefix="/repositories/{repository_id}/hotspots",tags=["hotspots"])
@router.get("",response_model=HotspotListResponse)
def hotspots(repository_id:int,snapshot_id:int|None=None,limit:int=Query(50,ge=1,le=500),cursor:int=Query(0,ge=0),language:str|None=None,include_tests:bool=True,db:Session=Depends(get_db)):
    if db.get(Repository,repository_id) is None: raise HTTPException(404,"Repository not found")
    snapshot=latest_ready(db,repository_id) if snapshot_id is None else db.get(ScanSnapshot,snapshot_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready": raise HTTPException(404,"No ready scan found")
    items=calculate_hotspots(db,snapshot.id,include_tests,language); page=items[cursor:cursor+limit]
    return HotspotListResponse(snapshot_id=snapshot.id,items=page,next_cursor=cursor+limit if cursor+limit<len(items) else None,has_more=cursor+limit<len(items),total=len(items))
