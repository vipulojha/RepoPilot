from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class GitFileStatus(BaseModel):
    path: str
    status: str
    index: str
    worktree: str
    rename_from: str | None = None
    conflict: bool = False
    additions: int = 0
    deletions: int = 0


class GitRemote(BaseModel):
    name: str
    fetch_url: str
    push_url: str


class GitUpstream(BaseModel):
    name: str
    ahead: int
    behind: int


class GitHead(BaseModel):
    sha: str
    short_sha: str
    message: str
    author: str | None = None
    committed_at: str | None = None


class GitStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    is_git_repository: bool = True
    branch: str | None = None
    head: GitHead | None = None
    detached: bool = False
    upstream: GitUpstream | None = None
    ahead: int = 0
    behind: int = 0
    diverged: bool = False
    shallow: bool = False
    files: list[GitFileStatus] = []
    remotes: list[GitRemote] = []
    local_branches: list[str] = []
    tags: list[str] = []
    clean: bool = True
    staged_count: int = 0
    unstaged_count: int = 0
    untracked_count: int = 0
    deleted_count: int = 0
    conflicted_count: int = 0

class GitActionRequest(BaseModel):
    action: Literal["stage", "unstage", "commit", "branch_create", "branch_switch", "fetch", "push", "pull", "revert", "stash_create", "stash_list", "stash_apply", "stash_pop", "stash_drop"]
    paths: list[str] = Field(default_factory=list)
    message: str | None = Field(default=None, max_length=5000)
    name: str | None = Field(default=None, max_length=255)
    start_point: str | None = Field(default=None, max_length=255)
    remote: str | None = Field(default=None, max_length=255)
    branch: str | None = Field(default=None, max_length=255)
    commit: str | None = Field(default=None, max_length=100)
    confirm: bool = False
    confirm_dirty: bool = False

class GitActionReceipt(BaseModel):
    action: str
    status: Literal["succeeded", "rejected", "conflict", "failed"]
    message: str
    recovery_guidance: str | None = None
    git: GitStatusResponse | None = None
    status_refresh: GitStatusResponse
    intelligence_stale: bool = True
    stdout_summary: str = ""

class GitChangedFile(BaseModel):
    path: str
    old_path: str | None = None
    status: str
    additions: int = 0
    deletions: int = 0
    file_id: int | None = None

class GitCommit(BaseModel):
    sha: str
    short_sha: str
    subject: str
    author: str
    committed_at: str
    parents: list[str] = []
    is_merge: bool = False
    changed_files: int = 0
    additions: int = 0
    deletions: int = 0
    files: list[GitChangedFile] = []

class GitHistoryResponse(BaseModel):
    items: list[GitCommit]
    page: int
    limit: int
    has_more: bool
    ref: str | None = None
    detached: bool = False
    empty: bool = False

class GitFileHistoryResponse(BaseModel):
    file_id: int
    path: str
    items: list[GitCommit]
    has_more: bool

class GitCompareResponse(BaseModel):
    base: str
    head: str
    commits: int
    files: list[GitChangedFile]
    additions: int = 0
    deletions: int = 0
