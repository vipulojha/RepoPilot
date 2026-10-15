from pydantic import BaseModel

class GraphNode(BaseModel):
    id: int; path: str; name: str; language: str; classification: str; is_test: bool; incoming: int; outgoing: int
class GraphEdge(BaseModel):
    id: int; source: int; target: int; kind: str; imported_name: str; source_line: int; source_column: int; evidence: str
class GraphResponse(BaseModel):
    snapshot_id: int; root_file_id: int; nodes: list[GraphNode]; edges: list[GraphEdge]; node_count: int; edge_count: int; truncated: bool; direction: str; depth: int
