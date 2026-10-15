from collections import defaultdict, deque
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import Dependency, RepositoryFile, Symbol
from app.schemas.hotspots import HotspotMetrics, HotspotResponse

def _normalize(values: dict[int, int]) -> dict[int, float]:
    if not values: return {}
    low, high = min(values.values()), max(values.values())
    if low == high: return {key: 0.5 for key in values}
    return {key: (value - low) / (high - low) for key, value in values.items()}

def calculate_hotspots(db: Session, snapshot_id: int, include_tests: bool = True, language: str | None = None) -> list[HotspotResponse]:
    files = [file for file in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot_id).order_by(RepositoryFile.relative_path, RepositoryFile.id)).all() if file.classification == "TEXT" and (include_tests or not file.is_test) and (language is None or file.language == language)]
    eligible = {file.id: file for file in files}; symbols = defaultdict(int)
    for symbol in db.scalars(select(Symbol).where(Symbol.snapshot_id == snapshot_id)).all(): symbols[symbol.file_id] += 1
    incoming, outgoing = defaultdict(set), defaultdict(set); reverse = defaultdict(set)
    for edge in db.scalars(select(Dependency).where(Dependency.snapshot_id == snapshot_id, Dependency.resolution_status == "internal")).all():
        if edge.source_file_id in eligible and edge.target_file_id in eligible:
            outgoing[edge.source_file_id].add(edge.target_file_id); incoming[edge.target_file_id].add(edge.source_file_id); reverse[edge.target_file_id].add(edge.source_file_id)
    reach = {}
    for root in eligible:
        seen={root}; queue=deque([(root,0)])
        while queue:
            current, depth=queue.popleft()
            if depth >= 3: continue
            for parent in sorted(reverse[current]):
                if parent not in seen: seen.add(parent); queue.append((parent, depth+1))
        reach[root] = len(seen)-1
    metrics={file.id: HotspotMetrics(lines=file.line_count or 0, symbols=symbols[file.id], fan_in=len(incoming[file.id]), fan_out=len(outgoing[file.id]), impact_reach=reach[file.id]) for file in files}
    normalized={field: _normalize({file_id: getattr(value, field) for file_id,value in metrics.items()}) for field in ("lines","symbols","fan_in","fan_out","impact_reach")}
    ranked=[]
    for file in files:
        score=100*(.20*normalized['lines'][file.id]+.20*normalized['symbols'][file.id]+.25*normalized['fan_in'][file.id]+.15*normalized['fan_out'][file.id]+.20*normalized['impact_reach'][file.id])
        value=metrics[file.id]; reasons=[]
        if value.fan_in: reasons.append(f"{value.fan_in} internal dependents (fan-in)")
        if value.fan_out: reasons.append(f"{value.fan_out} internal dependencies (fan-out)")
        if value.impact_reach: reasons.append(f"{value.impact_reach} files in bounded reverse impact reach")
        if value.lines: reasons.append(f"{value.lines} lines")
        if value.symbols: reasons.append(f"{value.symbols} symbols")
        ranked.append((score,file,value,reasons))
    ranked.sort(key=lambda item: (-item[0], -item[2].fan_in, -item[2].impact_reach, item[1].relative_path, item[1].id))
    return [HotspotResponse(file_id=file.id,path=file.relative_path,name=file.name,language=file.language,is_test=file.is_test,score=round(max(0,min(100,score)),2),rank=index+1,metrics=metrics,reasons=reasons) for index,(score,file,metrics,reasons) in enumerate(ranked)]
