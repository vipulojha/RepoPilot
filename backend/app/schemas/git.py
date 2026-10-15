from pydantic import BaseModel, ConfigDict


class GitFileStatus(BaseModel):
    path: str
    status: str
    index: str
    worktree: str
    rename_from: str | None = None
    conflict: bool = False


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
