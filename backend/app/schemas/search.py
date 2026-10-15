from pydantic import BaseModel

class SearchHitResponse(BaseModel):
    type: str; file_id: int; symbol_id: int | None; path: str; name: str
    language: str | None; line: int | None; snippet: str; rank: float

class SearchResponse(BaseModel):
    snapshot_id: int; items: list[SearchHitResponse]; next_cursor: int | None; has_more: bool
