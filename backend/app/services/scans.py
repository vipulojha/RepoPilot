import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Repository, RepositoryFile, ScanSnapshot
from app.services.scanner.ignore import build_ignore_policy
from app.services.scanner.scanner import ScanLimits, discover_files, metadata_for_file, resolve_repository_root


def create_scan_snapshot(db: Session, repository_id: int) -> ScanSnapshot:
    snapshot = ScanSnapshot(repository_id=repository_id, status="queued")
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def run_scan(db: Session, snapshot_id: int, limits: ScanLimits | None = None) -> ScanSnapshot:
    snapshot = db.get(ScanSnapshot, snapshot_id)
    if snapshot is None:
        raise ValueError("Scan not found")
    repository = db.get(Repository, snapshot.repository_id)
    if repository is None:
        return fail_scan(db, snapshot_id, "Repository not found")
    limits = limits or ScanLimits()
    warnings: list[str] = []
    try:
        root = resolve_repository_root(repository.path)
        snapshot.status = "scanning"
        snapshot.started_at = datetime.now(timezone.utc)
        db.commit()
        policy = build_ignore_policy(root)
        discovered = list(discover_files(root, policy, limits))
        snapshot.discovered_files = len(discovered)
        db.commit()
        for item in discovered:
            try:
                metadata = metadata_for_file(root, item.path, limits)
                db.add(RepositoryFile(snapshot_id=snapshot.id, **metadata.__dict__, classification="SKIPPED" if metadata.warning and metadata.line_count is None and not metadata.is_binary else "BINARY" if metadata.is_binary else "TEXT"))
                snapshot.processed_files += 1
                if metadata.warning:
                    warnings.append(f"{metadata.relative_path}: {metadata.warning}")
            except (OSError, UnicodeError, ValueError) as exc:
                warnings.append(f"{item.relative_path}: {exc}")
            if snapshot.processed_files % 100 == 0:
                db.commit()
        snapshot.status = "finalizing"
        db.flush()
        persisted_files = db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot.id)).all()
        snapshot.file_count = len(persisted_files)
        snapshot.total_bytes = sum(file.size_bytes for file in persisted_files)
        snapshot.total_lines = sum(file.line_count or 0 for file in persisted_files)
        snapshot.warning_count = len(warnings)
        snapshot.warnings_json = json.dumps(warnings)
        db.commit()
        snapshot.status = "ready"
        snapshot.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(snapshot)
        return snapshot
    except Exception as exc:
        db.rollback()
        return fail_scan(db, snapshot_id, str(exc))


def finalize_scan(db: Session, snapshot_id: int) -> ScanSnapshot:
    snapshot = db.get(ScanSnapshot, snapshot_id)
    if snapshot is None:
        raise ValueError("Scan not found")
    snapshot.status = "ready"
    snapshot.completed_at = datetime.now(timezone.utc)
    db.commit()
    return snapshot


def fail_scan(db: Session, snapshot_id: int, message: str) -> ScanSnapshot:
    snapshot = db.get(ScanSnapshot, snapshot_id)
    if snapshot is None:
        raise ValueError("Scan not found")
    snapshot.status = "failed"
    snapshot.error_message = message[:500]
    snapshot.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def latest_ready(db: Session, repository_id: int) -> ScanSnapshot | None:
    return db.scalars(select(ScanSnapshot).where(ScanSnapshot.repository_id == repository_id, ScanSnapshot.status == "ready").order_by(ScanSnapshot.id.desc())).first()
