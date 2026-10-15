from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SymbolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    snapshot_id: int
    file_id: int
    parent_symbol_id: int | None
    kind: str
    name: str
    qualified_name: str
    start_line: int
    start_column: int
    end_line: int
    end_column: int
    signature: str | None
    warning: str | None
    created_at: datetime


class SymbolListResponse(BaseModel):
    snapshot_id: int
    items: list[SymbolResponse]
    next_cursor: int | None
    has_more: bool
