from collections import deque
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import Dependency, RepositoryFile
from app.schemas.graph import GraphEdge, GraphNode

def project_graph(db: Session, snapshot_id: int, root_file_id: int, direction: str, depth: int, max_nodes: int, max_edges: int):
    files = {f.id: f for f in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot_id)).all()}
    nodes = {root_file_id}; edges_by_key = {}
    queue = deque([(root_file_id, 0)]); truncated = False
    while queue:
        current, distance = queue.popleft()
        if distance >= depth: continue
        queries = []
        if direction in {"outgoing", "both"}: queries.append((Dependency.source_file_id == current, "outgoing"))
        if direction in {"incoming", "both"}: queries.append((Dependency.target_file_id == current, "incoming"))
        for condition, _ in queries:
            rows = db.scalars(select(Dependency).where(Dependency.snapshot_id == snapshot_id, condition, Dependency.resolution_status == "internal").order_by(Dependency.source_file_id, Dependency.target_file_id, Dependency.id)).all()
            for edge in rows:
                if edge.source_file_id not in files or edge.target_file_id not in files: continue
                key = (edge.source_file_id, edge.target_file_id)
                if key not in edges_by_key:
                    if len(edges_by_key) >= max_edges: truncated = True; continue
                    edges_by_key[key] = edge
                neighbor = edge.target_file_id if edge.source_file_id == current else edge.source_file_id
                if neighbor not in nodes:
                    if len(nodes) >= max_nodes: truncated = True; continue
                    nodes.add(neighbor); queue.append((neighbor, distance + 1))
    ordered_nodes = sorted(nodes, key=lambda item: (files[item].relative_path, item))
    incoming = {node: 0 for node in nodes}; outgoing = {node: 0 for node in nodes}
    visible_edges = [edge for edge in edges_by_key.values() if edge.source_file_id in nodes and edge.target_file_id in nodes]
    for edge in visible_edges: outgoing[edge.source_file_id] += 1; incoming[edge.target_file_id] += 1
    graph_nodes = [GraphNode(id=node, path=files[node].relative_path, name=files[node].name, language=files[node].language, classification=files[node].classification, is_test=files[node].is_test, incoming=incoming[node], outgoing=outgoing[node]) for node in ordered_nodes]
    graph_edges = [GraphEdge(id=edge.id, source=edge.source_file_id, target=edge.target_file_id, kind=edge.kind, imported_name=edge.imported_name, source_line=edge.source_line, source_column=edge.source_column, evidence=edge.evidence) for edge in sorted(visible_edges, key=lambda item: (item.source_file_id, item.target_file_id, item.id))]
    return graph_nodes, graph_edges, truncated

def project_repository_graph(db: Session, snapshot_id: int, max_nodes: int, max_edges: int):
    files = {f.id: f for f in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot_id)).all()}
    rows = db.scalars(select(Dependency).where(Dependency.snapshot_id == snapshot_id, Dependency.resolution_status == "internal").order_by(Dependency.source_file_id, Dependency.target_file_id, Dependency.id)).all()
    nodes = set(); edges = []; truncated = False
    for edge in rows:
        if edge.source_file_id not in files or edge.target_file_id not in files: continue
        if len(nodes | {edge.source_file_id, edge.target_file_id}) > max_nodes or len(edges) >= max_edges:
            truncated = True; continue
        nodes.update((edge.source_file_id, edge.target_file_id)); edges.append(edge)
    incoming = {node: 0 for node in nodes}; outgoing = {node: 0 for node in nodes}
    for edge in edges: outgoing[edge.source_file_id] += 1; incoming[edge.target_file_id] += 1
    graph_nodes = [GraphNode(id=node, path=files[node].relative_path, name=files[node].name, language=files[node].language, classification=files[node].classification, is_test=files[node].is_test, incoming=incoming[node], outgoing=outgoing[node]) for node in sorted(nodes, key=lambda item: (files[item].relative_path, item))]
    graph_edges = [GraphEdge(id=edge.id, source=edge.source_file_id, target=edge.target_file_id, kind=edge.kind, imported_name=edge.imported_name, source_line=edge.source_line, source_column=edge.source_column, evidence=edge.evidence) for edge in edges]
    return graph_nodes, graph_edges, truncated
