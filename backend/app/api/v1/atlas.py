from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository
from app.schemas.atlas import AtlasResponse
from app.services.atlas import project_atlas
from app.services.scans import latest_ready

router = APIRouter(prefix="/repositories/{repository_id}/atlas", tags=["atlas"])

@router.get("", response_model=AtlasResponse)
def atlas(repository_id: int, db: Session = Depends(get_db)):
    if db.get(Repository, repository_id) is None: raise HTTPException(404, "Repository not found")
    snapshot = latest_ready(db, repository_id)
    if snapshot is None: raise HTTPException(404, "No ready scan found")
    return project_atlas(db, snapshot.id)
