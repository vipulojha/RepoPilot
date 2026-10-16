from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository, RepositoryFile, ScanSnapshot
from app.schemas.impact import ImpactRequest, ImpactResponse, ImpactPathNode
from app.services.impact import analyze_impact, build_test_validation
from app.services.scans import latest_ready

router = APIRouter(prefix="/repositories/{repository_id}/impact", tags=["impact"])

@router.post("", response_model=ImpactResponse)
def impact(repository_id: int, payload: ImpactRequest, db: Session = Depends(get_db)):
    if db.get(Repository, repository_id) is None: raise HTTPException(404, "Repository not found")
    snapshot = latest_ready(db, repository_id) if payload.snapshot_id is None else db.get(ScanSnapshot, payload.snapshot_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready": raise HTTPException(404, "No ready scan found")
    files = {row.id: row for row in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot.id, RepositoryFile.id.in_(payload.changed_file_ids))).all()}
    if len(files) != len(set(payload.changed_file_ids)): raise HTTPException(404, "Changed file not found")
    roots = [ImpactPathNode(file_id=file_id, path=files[file_id].relative_path) for file_id in sorted(files)]
    items = analyze_impact(db, snapshot.id, list(files), payload.max_depth)
    test_validation, test_count, hotspot_count = build_test_validation(db, snapshot.id, [*files, *(item.file_id for item in items)])
    return ImpactResponse(snapshot_id=snapshot.id, changed_roots=roots, affected_files=items, counts={"changed": len(roots), "affected": len(items), "direct": sum(item.depth == 1 for item in items), "transitive": sum(item.depth > 1 for item in items), "tests": test_count, "hazards": hotspot_count}, test_validation=test_validation)
