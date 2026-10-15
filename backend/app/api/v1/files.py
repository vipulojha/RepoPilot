from pathlib import PurePosixPath

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import RepositoryFile, ScanSnapshot
from app.schemas.files import FileListResponse, FileResponse, TreeNode, TreeResponse
from app.services.scans import latest_ready

router = APIRouter(prefix="/repositories/{repository_id}/files", tags=["files"])


def ready_snapshot(db: Session, repository_id: int, snapshot_id: int | None) -> ScanSnapshot:
    snapshot = db.get(ScanSnapshot, snapshot_id) if snapshot_id else latest_ready(db, repository_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready":
        raise HTTPException(404, "No ready scan found")
    return snapshot


@router.get("", response_model=FileListResponse)
def list_files(repository_id: int, snapshot_id: int | None = None, path_prefix: str | None = None, language: str | None = None, is_test: bool | None = None, limit: int = Query(100, ge=1, le=500), cursor: int | None = None, db: Session = Depends(get_db)):
    snapshot = ready_snapshot(db, repository_id, snapshot_id)
    if path_prefix and (PurePosixPath(path_prefix).is_absolute() or ".." in PurePosixPath(path_prefix).parts):
        raise HTTPException(422, "Invalid path prefix")
    query = select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot.id)
    if path_prefix: query = query.where(RepositoryFile.relative_path.startswith(path_prefix.rstrip("/") + "/"))
    if language: query = query.where(RepositoryFile.language == language)
    if is_test is not None: query = query.where(RepositoryFile.is_test == is_test)
    if cursor: query = query.where(RepositoryFile.id > cursor)
    rows = db.scalars(query.order_by(RepositoryFile.id).limit(limit + 1)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    return FileListResponse(snapshot_id=snapshot.id, items=rows, next_cursor=rows[-1].id if has_more and rows else None, has_more=has_more)


@router.get("/tree", response_model=TreeResponse)
def file_tree(repository_id: int, snapshot_id: int | None = None, parent_path: str = "", depth: int = Query(1, ge=1, le=10), include_files: bool = True, db: Session = Depends(get_db)):
    snapshot = ready_snapshot(db, repository_id, snapshot_id)
    parent = PurePosixPath(parent_path)
    if parent.is_absolute() or ".." in parent.parts: raise HTTPException(422, "Invalid parent path")
    prefix = parent.as_posix().strip(".")
    files = db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot.id)).all()
    nodes: dict[str, TreeNode] = {}
    for file in files:
        if prefix and not file.relative_path.startswith(prefix.rstrip("/") + "/"): continue
        relative = PurePosixPath(file.relative_path)
        remainder = relative.relative_to(parent) if prefix else relative
        if len(remainder.parts) == 1:
            if include_files: nodes[file.relative_path] = TreeNode(name=file.name, path=file.relative_path, kind="file", language=file.language, size_bytes=file.size_bytes)
        else:
            child = remainder.parts[0]
            path = f"{prefix}/{child}" if prefix else child
            nodes[path] = TreeNode(name=child, path=path, kind="directory", child_count=sum(1 for other in files if other.relative_path.startswith(path + "/")))
    return TreeResponse(snapshot_id=snapshot.id, path=prefix, items=sorted(nodes.values(), key=lambda item: (item.kind != "directory", item.path)))


@router.get("/{file_id}", response_model=FileResponse)
def get_file(repository_id: int, file_id: int, snapshot_id: int | None = None, db: Session = Depends(get_db)):
    snapshot = ready_snapshot(db, repository_id, snapshot_id)
    file = db.scalar(select(RepositoryFile).where(RepositoryFile.id == file_id, RepositoryFile.snapshot_id == snapshot.id))
    if file is None: raise HTTPException(404, "File not found")
    return file
