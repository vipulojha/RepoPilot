import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ScanSnapshot


class ScanCreate(BaseModel):
    force: bool = False


class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    repository_id: int
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    processed_files: int
    discovered_files: int
    percentage: int
    statistics: dict[str, int]
    warnings: list[str]
    error_message: str | None = None


def scan_response(snapshot: ScanSnapshot) -> ScanResponse:
    percentage = 100 if snapshot.status == "ready" else int(snapshot.processed_files / snapshot.discovered_files * 100) if snapshot.discovered_files else 0
    return ScanResponse(
        id=snapshot.id, repository_id=snapshot.repository_id, status=snapshot.status,
        started_at=snapshot.started_at, completed_at=snapshot.completed_at,
        processed_files=snapshot.processed_files, discovered_files=snapshot.discovered_files,
        percentage=percentage, statistics={"file_count": snapshot.file_count, "total_bytes": snapshot.total_bytes, "total_lines": snapshot.total_lines},
        warnings=json.loads(snapshot.warnings_json or "[]"), error_message=snapshot.error_message,
    )
