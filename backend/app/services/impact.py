from collections import deque
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import Dependency, RepositoryFile
from app.schemas.impact import ImpactEvidence, ImpactItem, ImpactPathNode, ImpactTestValidation
from app.services.hotspots import calculate_hotspots
from app.services.test_relationships import relationships

def analyze_impact(db: Session, snapshot_id: int, changed_file_ids: list[int], max_depth: int):
    files = {row.id: row for row in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot_id)).all()}
    queue = deque((file_id, 0, [file_id], []) for file_id in sorted(set(changed_file_ids)))
    best: dict[int, tuple[int, list[int], list[Dependency], set[int]]] = {}
    roots = set(changed_file_ids)
    while queue:
        current, depth, path, evidence = queue.popleft()
        if depth >= max_depth: continue
        edges = db.scalars(select(Dependency).where(Dependency.snapshot_id == snapshot_id, Dependency.target_file_id == current, Dependency.resolution_status == "internal").order_by(Dependency.source_file_id, Dependency.id)).all()
        for edge in edges:
            source = edge.source_file_id
            if source in path: continue
            next_path = [source, *path]
            next_evidence = [edge, *evidence]
            next_depth = depth + 1
            root = path[0]
            candidate = best.get(source)
            if candidate is None or (next_depth, files.get(source).relative_path if source in files else "", source) < (candidate[0], files.get(source).relative_path if source in files else "", source):
                best[source] = (next_depth, next_path, next_evidence, {root})
            else:
                candidate[3].add(root)
            queue.append((source, next_depth, next_path, next_evidence))
    items = []
    for file_id, (depth, path, edges, root_ids) in best.items():
        if file_id in roots or file_id not in files: continue
        items.append(ImpactItem(file_id=file_id, path=files[file_id].relative_path, depth=depth, changed_root_ids=sorted(root_ids), dependency_path=[ImpactPathNode(file_id=item, path=files[item].relative_path) for item in reversed(path) if item in files], evidence=[ImpactEvidence(imported_name=edge.imported_name, kind=edge.kind, source_line=edge.source_line, source_column=edge.source_column, evidence=edge.evidence) for edge in reversed(edges)]))
    items.sort(key=lambda item: (item.depth, item.path, item.file_id))
    return items

def build_test_validation(db: Session, snapshot_id: int, file_ids: list[int]):
    files = {row.id: row for row in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot_id)).all()}
    hotspots = {item.file_id: item for item in calculate_hotspots(db, snapshot_id, include_tests=False)}
    validation = []
    mapped_tests = set()
    for file_id in file_ids:
        file = files.get(file_id)
        if file is None or file.is_test:
            continue
        related = relationships(db, snapshot_id, file_id, 'source')
        if related:
            for item in related:
                mapped_tests.add(item.test_file_id)
                validation.append(ImpactTestValidation(file_id=file.id, file_path=file.relative_path, test_file_id=item.test_file_id, test_path=item.test_path, status='Mapped', tag='STATIC LINKED', cases='Static relationship • No runtime execution', detail=item.evidence, type='passing', evidence_level=item.evidence_level))
            continue
        hotspot = hotspots.get(file_id)
        validation.append(ImpactTestValidation(file_id=file.id, file_path=file.relative_path, status='Uncovered Hotspot' if hotspot else 'Untested Risk', tag='HOTSPOT' if hotspot else 'SAFETY GAP', cases='UNCOVERED HOTSPOT' if hotspot else 'No static test relationship', detail='; '.join(hotspot.reasons) if hotspot else 'No deterministic test association was found; runtime coverage is not measured.', type='error' if hotspot else 'warning'))
    return validation, len(mapped_tests), sum(item.type == 'error' for item in validation)
