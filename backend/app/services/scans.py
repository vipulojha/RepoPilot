import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Dependency, Repository, RepositoryFile, ScanSnapshot, Symbol
from app.services.dependencies import DependencyData, extract_dependencies, resolve_dependency
from app.services.scanner.ignore import build_ignore_policy
from app.services.scanner.scanner import ScanLimits, discover_files, metadata_for_file, resolve_repository_root
from app.services.parser.extractor import extract_symbols
from app.services.parser.service import parse_source
from app.config import get_settings
from app.services.search import index_document


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
        path_map = {item.relative_path for item in discovered}
        file_rows: dict[str, RepositoryFile] = {}
        snapshot.discovered_files = len(discovered)
        db.commit()
        for item in discovered:
            try:
                metadata = metadata_for_file(root, item.path, limits)
                file_row = RepositoryFile(snapshot_id=snapshot.id, **metadata.__dict__, classification="SKIPPED" if metadata.warning and metadata.line_count is None and not metadata.is_binary else "BINARY" if metadata.is_binary else "TEXT")
                db.add(file_row)
                db.flush()
                file_rows[metadata.relative_path] = file_row
                if metadata.line_count is not None and not metadata.is_binary and not metadata.warning:
                    index_document(db, snapshot.id, "file", file_row.id, metadata.relative_path, metadata.name, item.path.read_text(encoding="utf-8", errors="replace"))
                if metadata.line_count is not None and not metadata.is_binary and metadata.warning is None:
                    source = item.path.read_bytes()
                    parsed = parse_source(metadata.language, source, metadata.relative_path, get_settings().parse_max_file_bytes)
                    warnings.extend(f"{metadata.relative_path}: {warning.message}" for warning in parsed.warnings)
                    if parsed.tree is not None:
                        created_symbols: dict[str, Symbol] = {}
                        for symbol in extract_symbols(parsed.tree.root_node, source):
                            row = Symbol(snapshot_id=snapshot.id, file_id=file_row.id, kind=symbol.kind, name=symbol.name, qualified_name=symbol.qualified_name, start_line=symbol.start_line, start_column=symbol.start_column, end_line=symbol.end_line, end_column=symbol.end_column, signature=symbol.signature, parent_symbol_id=created_symbols.get(symbol.parent_name).id if symbol.parent_name and symbol.parent_name in created_symbols else None)
                            db.add(row)
                            db.flush()
                            created_symbols[symbol.qualified_name] = row
                            index_document(db, snapshot.id, "symbol", file_row.id, metadata.relative_path, symbol.qualified_name, symbol.signature or symbol.name, row.id)
                        for dependency in extract_dependencies(parsed.tree.root_node, source, metadata.language):
                            resolution, target_path = resolve_dependency(dependency, metadata.relative_path, metadata.language, path_map)
                            target_id = file_rows.get(target_path).id if target_path and target_path in file_rows else None
                            db.add(Dependency(snapshot_id=snapshot.id, source_file_id=file_row.id, target_file_id=target_id, imported_name=dependency.imported_name, kind=dependency.kind, resolution_status=resolution, source_line=dependency.line, source_column=dependency.column, evidence=dependency.evidence))
                snapshot.processed_files += 1
                if metadata.warning:
                    warnings.append(f"{metadata.relative_path}: {metadata.warning}")
            except (OSError, UnicodeError, ValueError) as exc:
                warnings.append(f"{item.relative_path}: {exc}")
            if snapshot.processed_files % 100 == 0:
                db.commit()
        for dependency in db.scalars(select(Dependency).where(Dependency.snapshot_id == snapshot.id)).all():
            if dependency.resolution_status == "internal" and dependency.target_file_id is None:
                source_file = next((row for row in file_rows.values() if row.id == dependency.source_file_id), None)
                if source_file:
                    _, target_path = resolve_dependency(DependencyData(dependency.imported_name, dependency.kind, dependency.source_line, dependency.source_column, dependency.evidence), source_file.relative_path, source_file.language, path_map)
                    if target_path in file_rows: dependency.target_file_id = file_rows[target_path].id
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
