from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Repository, RepositoryFile, ScanSnapshot
from app.schemas.graph import GraphResponse
from app.services.graph import project_graph, project_repository_graph
from app.services.scans import latest_ready

router = APIRouter(prefix="/repositories/{repository_id}/graph", tags=["graph"])

@router.get("", response_model=GraphResponse)
def graph(repository_id: int, root_file_id: int | None = None, snapshot_id: int | None = None, direction: str = Query("both", pattern="^(both|incoming|outgoing)$"), depth: int = Query(2, ge=0, le=6), max_nodes: int = Query(100, ge=1, le=500), max_edges: int = Query(200, ge=1, le=1000), db: Session = Depends(get_db)):
    if db.get(Repository, repository_id) is None: raise HTTPException(404, "Repository not found")
    snapshot = latest_ready(db, repository_id) if snapshot_id is None else db.get(ScanSnapshot, snapshot_id)
    if snapshot is None or snapshot.repository_id != repository_id or snapshot.status != "ready": raise HTTPException(404, "No ready scan found")
    if root_file_id is not None and db.scalar(select(RepositoryFile).where(RepositoryFile.id == root_file_id, RepositoryFile.snapshot_id == snapshot.id)) is None: raise HTTPException(404, "Root file not found")
    nodes, edges, truncated = project_graph(db, snapshot.id, root_file_id, direction, depth, max_nodes, max_edges) if root_file_id is not None else project_repository_graph(db, snapshot.id, max_nodes, max_edges)
    return GraphResponse(snapshot_id=snapshot.id, root_file_id=root_file_id or 0, nodes=nodes, edges=edges, node_count=len(nodes), edge_count=len(edges), truncated=truncated, direction=direction, depth=depth)
