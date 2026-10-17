from collections import defaultdict
from pathlib import PurePosixPath
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import Dependency, RepositoryFile, Symbol
from app.services.hotspots import calculate_hotspots
from app.schemas.atlas import AtlasEdge, AtlasFile, AtlasMetrics, AtlasModule, AtlasRegion, AtlasResponse

def _parts(path: str) -> list[str]: return [part for part in PurePosixPath(path).parts if part not in (".", "")]
def _region(path: str) -> str:
    parts = _parts(path)
    return parts[0] if len(parts) > 1 else "(root)"

def _module(path: str) -> str:
    parts = _parts(path)
    if len(parts) <= 1: return "(root)"
    return "/".join(parts[:3])

def project_atlas(db: Session, snapshot_id: int) -> AtlasResponse:
    files = db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot_id).order_by(RepositoryFile.relative_path, RepositoryFile.id)).all()
    by_id = {file.id: file for file in files}; symbols = defaultdict(int)
    for symbol in db.scalars(select(Symbol).where(Symbol.snapshot_id == snapshot_id)).all(): symbols[symbol.file_id] += 1
    dependencies = [edge for edge in db.scalars(select(Dependency).where(Dependency.snapshot_id == snapshot_id, Dependency.resolution_status == "internal").order_by(Dependency.source_file_id, Dependency.target_file_id, Dependency.id)).all() if edge.source_file_id in by_id and edge.target_file_id in by_id]
    incoming, outgoing = defaultdict(int), defaultdict(int)
    for edge in dependencies: outgoing[edge.source_file_id] += 1; incoming[edge.target_file_id] += 1
    scores = {item.file_id: item.score for item in calculate_hotspots(db, snapshot_id)}
    region_files, module_files = defaultdict(list), defaultdict(list)
    for file in files: region_files[_region(file.relative_path)].append(file); module_files[_module(file.relative_path)].append(file)
    def aggregate(group):
        result = {}
        for key, members in group.items():
            result[key] = dict(files=members, symbol_count=sum(symbols[item.id] for item in members), inbound=sum(incoming[item.id] for item in members), outbound=sum(outgoing[item.id] for item in members), languages=sorted({item.language for item in members}), tests=sum(item.is_test for item in members), hotspots=sum(scores.get(item.id, 0) > 50 for item in members), score=round(sum(scores.get(item.id, 0) for item in members) / len(members), 2) if members else 0)
        return result
    regions_data, modules_data = aggregate(region_files), aggregate(module_files)
    module_id = {key: f"module:{key}" for key in modules_data}; region_id = {key: f"region:{key}" for key in regions_data}
    edges = defaultdict(lambda: [0, 0, 0.0])
    for edge in dependencies:
        source, target = _module(by_id[edge.source_file_id].relative_path), _module(by_id[edge.target_file_id].relative_path)
        if source == target: continue
        value = edges[(source, target)]; value[0] += 1; value[1] += by_id[edge.source_file_id].is_test or by_id[edge.target_file_id].is_test; value[2] += max(scores.get(edge.source_file_id, 0), scores.get(edge.target_file_id, 0))
    modules = [AtlasModule(id=module_id[key], region_id=region_id[_region(data['files'][0].relative_path)], label=key.split('/')[-1], path=key, file_count=len(data['files']), symbol_count=data['symbol_count'], inbound_dependencies=data['inbound'], outbound_dependencies=data['outbound'], languages=data['languages'], test_files=data['tests'], hotspots=data['hotspots'], hotspot_score=data['score'], files=[AtlasFile(file_id=f.id,path=f.relative_path,name=f.name,symbol_count=symbols[f.id],inbound_dependencies=incoming[f.id],outbound_dependencies=outgoing[f.id],is_test=f.is_test,hotspot_score=round(scores.get(f.id, 0), 2)) for f in data['files']]) for key, data in sorted(modules_data.items())]
    regions = [AtlasRegion(id=region_id[key],label=key,path=key,file_count=len(data['files']),symbol_count=data['symbol_count'],inbound_dependencies=data['inbound'],outbound_dependencies=data['outbound'],languages=data['languages'],test_files=data['tests'],hotspots=data['hotspots'],module_ids=sorted(module_id[m] for m in modules_data if _region(modules_data[m]['files'][0].relative_path)==key)) for key, data in sorted(regions_data.items())]
    atlas_edges = [AtlasEdge(id=f"edge:{source}->{target}",source=module_id[source],target=module_id[target],dependency_count=value[0],test_count=value[1],hotspot=round(value[2] / value[0], 2),weight=value[0]) for (source,target), value in sorted(edges.items())]
    return AtlasResponse(snapshot_id=snapshot_id, metrics=AtlasMetrics(regions=len(regions),modules=len(modules),files=len(files),dependencies=len(dependencies),hotspots=sum(item > 50 for item in scores.values()),test_relationships=sum(1 for edge in dependencies if by_id[edge.source_file_id].is_test or by_id[edge.target_file_id].is_test)), regions=regions, modules=modules, edges=atlas_edges)
