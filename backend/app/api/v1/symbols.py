from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Repository, ScanSnapshot, Symbol
from app.schemas.symbols import SymbolListResponse, SymbolResponse
from app.services.scans import latest_ready

router = APIRouter(prefix="/repositories/{repository_id}/symbols", tags=["symbols"])


def snapshot_for(db: Session, repository_id: int, snapshot_id: int | None):
    if db.get(Repository, repository_id) is None:
        raise HTTPException(404, "Repository not found")
    snapshot = latest_ready(db, repository_id) if snapshot_id is None else db.get(ScanSnapshot, snapshot_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready":
        raise HTTPException(404, "No ready scan found")
    return snapshot


@router.get("", response_model=SymbolListResponse)
def list_symbols(repository_id: int, snapshot_id: int | None = None, file_id: int | None = None, kind: str | None = None, name: str | None = None, limit: int = Query(100, ge=1, le=500), cursor: int | None = None, db: Session = Depends(get_db)):
    snapshot = snapshot_for(db, repository_id, snapshot_id)
    query = select(Symbol).where(Symbol.snapshot_id == snapshot.id)
    if file_id is not None: query = query.where(Symbol.file_id == file_id)
    if kind: query = query.where(Symbol.kind == kind)
    if name: query = query.where(Symbol.name == name)
    if cursor: query = query.where(Symbol.id > cursor)
    rows = db.scalars(query.order_by(Symbol.id).limit(limit + 1)).all()
    more = len(rows) > limit
    rows = rows[:limit]
    return SymbolListResponse(snapshot_id=snapshot.id, items=rows, next_cursor=rows[-1].id if more else None, has_more=more)


@router.get("/{symbol_id}", response_model=SymbolResponse)
def get_symbol(repository_id: int, symbol_id: int, snapshot_id: int | None = None, db: Session = Depends(get_db)):
    snapshot = snapshot_for(db, repository_id, snapshot_id)
    symbol = db.scalar(select(Symbol).where(Symbol.id == symbol_id, Symbol.snapshot_id == snapshot.id))
    if symbol is None: raise HTTPException(404, "Symbol not found")
    return symbol


file_symbols_router = APIRouter(prefix="/repositories/{repository_id}/files/{file_id}/symbols", tags=["symbols"])


@file_symbols_router.get("", response_model=SymbolListResponse)
def list_file_symbols(repository_id: int, file_id: int, snapshot_id: int | None = None, limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    snapshot = snapshot_for(db, repository_id, snapshot_id)
    rows = db.scalars(select(Symbol).where(Symbol.snapshot_id == snapshot.id, Symbol.file_id == file_id).order_by(Symbol.id).limit(limit)).all()
    return SymbolListResponse(snapshot_id=snapshot.id, items=rows, next_cursor=None, has_more=False)
