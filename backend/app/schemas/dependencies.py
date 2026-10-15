from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DependencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; snapshot_id: int; source_file_id: int; target_file_id: int | None
    imported_name: str; kind: str; resolution_status: str; source_line: int
    source_column: int; evidence: str; created_at: datetime

class DependencyListResponse(BaseModel):
    snapshot_id: int; items: list[DependencyResponse]; next_cursor: int | None; has_more: bool
