from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.router import get_repository
from app.db.database import get_db
from app.schemas.git import GitStatusResponse
from app.services.git import GitService, GitServiceError

router = APIRouter(prefix="/repositories", tags=["git"])


@router.get("/{repository_id}/git/status", response_model=GitStatusResponse)
def git_status(repository_id: int, db: Session = Depends(get_db)) -> GitStatusResponse:
    repository = get_repository(repository_id, db)
    try:
        return GitService().status(repository.path)
    except GitServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
