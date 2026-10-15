from pydantic import BaseModel

class HotspotMetrics(BaseModel):
    lines: int; symbols: int; fan_in: int; fan_out: int; impact_reach: int
class HotspotResponse(BaseModel):
    file_id: int; path: str; name: str; language: str; is_test: bool; score: float; rank: int; metrics: HotspotMetrics; reasons: list[str]
class HotspotListResponse(BaseModel):
    snapshot_id: int; items: list[HotspotResponse]; next_cursor: int | None; has_more: bool; total: int
