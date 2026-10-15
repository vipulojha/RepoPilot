from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.router import get_repository
from app.db.database import get_db
from app.schemas.git import GitActionRequest, GitActionReceipt
from app.services.git import GitService, GitServiceError

router = APIRouter(prefix="/repositories", tags=["git"])

@router.post("/{repository_id}/git/actions", response_model=GitActionReceipt)
def git_action(repository_id: int, payload: GitActionRequest, db: Session = Depends(get_db)):
    repository = get_repository(repository_id, db)
    try:
        return GitService().action(repository.path, **payload.model_dump())
    except GitServiceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
