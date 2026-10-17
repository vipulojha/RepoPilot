from pydantic import BaseModel

class AtlasFile(BaseModel):
    file_id: int; path: str; name: str; symbol_count: int; inbound_dependencies: int; outbound_dependencies: int; is_test: bool; hotspot_score: float
class AtlasModule(BaseModel):
    id: str; region_id: str; label: str; path: str; file_count: int; symbol_count: int; inbound_dependencies: int; outbound_dependencies: int; languages: list[str]; test_files: int; hotspots: int; hotspot_score: float; files: list[AtlasFile]
class AtlasRegion(BaseModel):
    id: str; label: str; path: str; file_count: int; symbol_count: int; inbound_dependencies: int; outbound_dependencies: int; languages: list[str]; test_files: int; hotspots: int; module_ids: list[str]
class AtlasEdge(BaseModel):
    id: str; source: str; target: str; dependency_count: int; test_count: int; hotspot: float; weight: float
class AtlasMetrics(BaseModel):
    regions: int; modules: int; files: int; dependencies: int; hotspots: int; test_relationships: int
class AtlasResponse(BaseModel):
    snapshot_id: int; metrics: AtlasMetrics; regions: list[AtlasRegion]; modules: list[AtlasModule]; edges: list[AtlasEdge]
