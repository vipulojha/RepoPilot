from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository
from app.schemas.changes import ChangeResponse
from app.services.changes import ChangeIntelligenceService

router = APIRouter(prefix="/repositories/{repository_id}/changes", tags=["changes"])

@router.get("", response_model=ChangeResponse)
def changes(repository_id: int, max_depth: int = Query(3, ge=1, le=5), limit: int = Query(100, ge=1, le=100), db: Session = Depends(get_db)) -> ChangeResponse:
    repository = db.get(Repository, repository_id)
    if repository is None: raise HTTPException(404, "Repository not found")
    return ChangeIntelligenceService().analyze(db, repository_id, repository.path, max_depth=max_depth, limit=limit)
