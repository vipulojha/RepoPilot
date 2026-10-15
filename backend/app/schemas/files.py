from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    snapshot_id: int
    relative_path: str
    name: str
    extension: str
    language: str
    classification: str
    size_bytes: int
    line_count: int | None
    is_binary: bool
    is_test: bool
    warning: str | None


class FileListResponse(BaseModel):
    snapshot_id: int
    items: list[FileResponse]
    next_cursor: int | None
    has_more: bool


class TreeNode(BaseModel):
    name: str
    path: str
    kind: str
    language: str | None = None
    size_bytes: int | None = None
    child_count: int | None = None


class TreeResponse(BaseModel):
    snapshot_id: int
    path: str
    items: list[TreeNode]
