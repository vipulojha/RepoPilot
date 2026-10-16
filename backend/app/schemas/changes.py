from pydantic import BaseModel, Field
from app.schemas.git import GitFileStatus, GitStatusResponse
from app.schemas.hotspots import HotspotResponse
from app.schemas.impact import ImpactItem
from app.schemas.test_relationships import TestRelationship

class ChangeDiffStats(BaseModel):
    files: int = 0
    additions: int = 0
    deletions: int = 0
    truncated: bool = False

class ChangedFileAnalysis(BaseModel):
    git: GitFileStatus
    file_id: int | None = None
    affected: bool = False
    unresolved: bool = False
    diff_lines: list[dict[str, int | str]] = []

class ChangeRisk(BaseModel):
    score: int = Field(ge=0, le=100)
    level: str
    reasons: list[str]
    thresholds: dict[str, int | float]

class ChangeResponse(BaseModel):
    state: str
    repository_id: int
    snapshot_id: int | None = None
    git: GitStatusResponse | None = None
    diff: ChangeDiffStats = ChangeDiffStats()
    changed_files: list[ChangedFileAnalysis] = []
    affected_files: list[ImpactItem] = []
    hotspots: list[HotspotResponse] = []
    tests: list[TestRelationship] = []
    risk: ChangeRisk
    truncated: bool = False
