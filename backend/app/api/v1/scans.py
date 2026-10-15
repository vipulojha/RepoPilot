from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Repository, ScanSnapshot
from app.config import get_settings
from app.schemas.scans import ScanCreate, ScanResponse, scan_response
from app.services.scans import create_scan_snapshot, latest_ready, run_scan

router = APIRouter(prefix="/repositories/{repository_id}/scans", tags=["scans"])


def get_repository(db: Session, repository_id: int) -> Repository:
    repository = db.get(Repository, repository_id)
    if repository is None:
        raise HTTPException(404, "Repository not found")
    return repository


@router.post("", response_model=ScanResponse, status_code=status.HTTP_202_ACCEPTED)
def start_scan(repository_id: int, payload: ScanCreate, db: Session = Depends(get_db)):
    get_repository(db, repository_id)
    active = db.scalars(select(ScanSnapshot).where(ScanSnapshot.repository_id == repository_id, ScanSnapshot.status.in_(["queued", "scanning", "finalizing"]))).first()
    if active:
        raise HTTPException(409, "A scan is already active")
    snapshot = create_scan_snapshot(db, repository_id)
    settings = get_settings()
    from app.services.scanner.scanner import ScanLimits
    return scan_response(run_scan(db, snapshot.id, ScanLimits(settings.scan_max_file_bytes, settings.scan_max_files)))


@router.get("", response_model=list[ScanResponse])
def list_scans(repository_id: int, db: Session = Depends(get_db)):
    get_repository(db, repository_id)
    return [scan_response(item) for item in db.scalars(select(ScanSnapshot).where(ScanSnapshot.repository_id == repository_id).order_by(ScanSnapshot.id.desc())).all()]


@router.get("/latest", response_model=ScanResponse)
def get_latest_scan(repository_id: int, db: Session = Depends(get_db)):
    get_repository(db, repository_id)
    snapshot = latest_ready(db, repository_id)
    if snapshot is None:
        raise HTTPException(404, "No ready scan found")
    return scan_response(snapshot)


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(repository_id: int, scan_id: int, db: Session = Depends(get_db)):
    get_repository(db, repository_id)
    snapshot = db.scalar(select(ScanSnapshot).where(ScanSnapshot.id == scan_id, ScanSnapshot.repository_id == repository_id))
    if snapshot is None:
        raise HTTPException(404, "Scan not found")
    return scan_response(snapshot)
