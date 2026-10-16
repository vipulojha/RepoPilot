from pydantic import BaseModel, Field

class ImpactRequest(BaseModel):
    changed_file_ids: list[int] = Field(min_length=1, max_length=50)
    snapshot_id: int | None = None
    max_depth: int = Field(default=3, ge=0, le=10)

class ImpactEvidence(BaseModel):
    imported_name: str
    kind: str
    source_line: int
    source_column: int
    evidence: str

class ImpactPathNode(BaseModel):
    file_id: int
    path: str

class ImpactItem(BaseModel):
    file_id: int
    path: str
    depth: int
    changed_root_ids: list[int]
    dependency_path: list[ImpactPathNode]
    evidence: list[ImpactEvidence]

class ImpactTestValidation(BaseModel):
    file_id: int
    file_path: str
    test_file_id: int | None = None
    test_path: str | None = None
    status: str
    tag: str
    cases: str
    detail: str
    type: str
    evidence_level: str | None = None

class ImpactResponse(BaseModel):
    snapshot_id: int
    changed_roots: list[ImpactPathNode]
    affected_files: list[ImpactItem]
    counts: dict[str, int]
    test_validation: list[ImpactTestValidation] = Field(default_factory=list)
