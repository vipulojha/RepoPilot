from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Dependency, Repository, ScanSnapshot
from app.schemas.dependencies import DependencyListResponse, DependencyResponse
from app.services.scans import latest_ready

router = APIRouter(prefix="/repositories/{repository_id}/dependencies", tags=["dependencies"])

def snapshot_for(db: Session, repository_id: int, snapshot_id: int | None):
    if db.get(Repository, repository_id) is None: raise HTTPException(404, "Repository not found")
    snapshot = latest_ready(db, repository_id) if snapshot_id is None else db.get(ScanSnapshot, snapshot_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready": raise HTTPException(404, "No ready scan found")
    return snapshot

def dependency_list(db: Session, repository_id: int, file_id: int, snapshot_id: int | None, reverse: bool, limit: int, cursor: int | None):
    snapshot = snapshot_for(db, repository_id, snapshot_id)
    column = Dependency.target_file_id if reverse else Dependency.source_file_id
    query = select(Dependency).where(Dependency.snapshot_id == snapshot.id, column == file_id)
    if cursor: query = query.where(Dependency.id > cursor)
    rows = db.scalars(query.order_by(Dependency.id).limit(limit + 1)).all(); more = len(rows) > limit; rows = rows[:limit]
    return DependencyListResponse(snapshot_id=snapshot.id, items=rows, next_cursor=rows[-1].id if more and rows else None, has_more=more)

@router.get("/files/{file_id}/forward", response_model=DependencyListResponse)
def forward(repository_id: int, file_id: int, snapshot_id: int | None = None, limit: int = Query(100, ge=1, le=500), cursor: int | None = None, db: Session = Depends(get_db)):
    return dependency_list(db, repository_id, file_id, snapshot_id, False, limit, cursor)

@router.get("/files/{file_id}/reverse", response_model=DependencyListResponse)
def reverse(repository_id: int, file_id: int, snapshot_id: int | None = None, limit: int = Query(100, ge=1, le=500), cursor: int | None = None, db: Session = Depends(get_db)):
    return dependency_list(db, repository_id, file_id, snapshot_id, True, limit, cursor)

@router.get("/{dependency_id}", response_model=DependencyResponse)
def detail(repository_id: int, dependency_id: int, snapshot_id: int | None = None, db: Session = Depends(get_db)):
    snapshot = snapshot_for(db, repository_id, snapshot_id)
    dependency = db.scalar(select(Dependency).where(Dependency.id == dependency_id, Dependency.snapshot_id == snapshot.id))
    if dependency is None: raise HTTPException(404, "Dependency not found")
    return dependency
