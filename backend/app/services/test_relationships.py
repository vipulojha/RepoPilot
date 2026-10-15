from pathlib import PurePosixPath
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import Dependency, RepositoryFile
from app.schemas.test_relationships import TestRelationship

def _stem(path:str) -> str:
    stem=PurePosixPath(path).stem.lower()
    for marker in ('.test','.spec','_test','_spec'):
        if stem.endswith(marker): return stem[:-len(marker)]
    if stem.startswith('test_'): return stem[5:]
    if stem.endswith('test') and len(stem)>4: return stem[:-4]
    return stem

def relationships(db:Session,snapshot_id:int,file_id:int,direction:str)->list[TestRelationship]:
    files={f.id:f for f in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id==snapshot_id)).all()}; file=files.get(file_id)
    if file is None: return []
    tests={f.id:f for f in files.values() if f.is_test}; sources={f.id:f for f in files.values() if not f.is_test and f.classification=='TEXT'}; found={}
    def add(test,source,kind,level,evidence):
        key=(test.id,source.id)
        if key not in found or found[key].evidence_level=='heuristic' and level=='strong': found[key]=TestRelationship(test_file_id=test.id,test_path=test.relative_path,source_file_id=source.id,source_path=source.relative_path,kind=kind,evidence_level=level,evidence=evidence)
    if direction=='source':
        for edge in db.scalars(select(Dependency).where(Dependency.snapshot_id==snapshot_id,Dependency.target_file_id==file_id,Dependency.resolution_status=='internal')).all():
            if edge.source_file_id in tests: add(tests[edge.source_file_id],file,'direct_dependency','strong',f"{tests[edge.source_file_id].name} imports {file.name} at line {edge.source_line}")
        for test in tests.values():
            if _stem(test.relative_path)==_stem(file.relative_path): add(test,file,'naming_convention','heuristic',f"{test.name} matches {file.name} by deterministic test naming")
    else:
        for edge in db.scalars(select(Dependency).where(Dependency.snapshot_id==snapshot_id,Dependency.source_file_id==file_id,Dependency.resolution_status=='internal')).all():
            if edge.target_file_id in sources: add(file,sources[edge.target_file_id],'direct_dependency','strong',f"{file.name} imports {sources[edge.target_file_id].name} at line {edge.source_line}")
        for source in sources.values():
            if _stem(file.relative_path)==_stem(source.relative_path): add(file,source,'naming_convention','heuristic',f"{file.name} matches {source.name} by deterministic test naming")
    return sorted(found.values(),key=lambda item:(0 if item.evidence_level=='strong' else 1,item.source_path,item.test_path))
