from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository, RepositoryFile, ScanSnapshot
from app.schemas.search import SearchHitResponse, SearchResponse
from app.services.scans import latest_ready
from app.services.search import search_documents

router = APIRouter(prefix="/repositories/{repository_id}/search", tags=["search"])

@router.get("", response_model=SearchResponse)
def search(repository_id: int, q: str = Query(..., min_length=1), snapshot_id: int | None = None, scope: str = Query("all", pattern="^(all|files|symbols|content)$"), language: str | None = None, limit: int = Query(50, ge=1, le=200), cursor: int = Query(0, ge=0), db: Session = Depends(get_db)):
    if db.get(Repository, repository_id) is None: raise HTTPException(404, "Repository not found")
    snapshot = latest_ready(db, repository_id) if snapshot_id is None else db.get(ScanSnapshot, snapshot_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready": raise HTTPException(404, "No ready scan found")
    try: rows, more = search_documents(db, snapshot.id, q, scope, limit, cursor)
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    result = []
    for row in rows:
        file = db.get(RepositoryFile, int(row["file_id"]))
        if language and (file is None or file.language != language): continue
        result.append(SearchHitResponse(type="code" if row["entity_type"] == "file" else row["entity_type"], file_id=int(row["file_id"]), symbol_id=int(row["symbol_id"]) if row["symbol_id"] else None, path=row["path"], name=row["name"], language=file.language if file else None, line=None, snippet=row["snippet"], rank=float(row["score"])))
    return SearchResponse(snapshot_id=snapshot.id, items=result, next_cursor=cursor + limit if more else None, has_more=more)
