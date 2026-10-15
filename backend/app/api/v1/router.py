from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Repository
from app.schemas.common import RepositoryCreate, RepositoryListResponse, RepositoryResponse

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.post("", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(payload: RepositoryCreate, db: Session = Depends(get_db)) -> Repository:
    repository = Repository(**payload.model_dump())
    db.add(repository)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A repository with this path already exists") from exc
    db.refresh(repository)
    return repository


@router.get("", response_model=RepositoryListResponse)
def list_repositories(db: Session = Depends(get_db)) -> RepositoryListResponse:
    repositories = db.scalars(select(Repository).order_by(Repository.id)).all()
    return RepositoryListResponse(items=repositories)


@router.get("/{repository_id}", response_model=RepositoryResponse)
def get_repository(repository_id: int, db: Session = Depends(get_db)) -> Repository:
    repository = db.get(Repository, repository_id)
    if repository is None:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repository

@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(repository_id: int, db: Session = Depends(get_db)) -> None:
    repository = db.get(Repository, repository_id)
    if repository is None:
        raise HTTPException(status_code=404, detail="Repository not found")
    db.delete(repository)
    db.commit()
