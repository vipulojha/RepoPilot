from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class InspectRequest(BaseModel):
    kind: Literal["folder", "file"]
    path: str = Field(min_length=1, max_length=4096)


class OnboardRequest(BaseModel):
    path: str = Field(min_length=1, max_length=4096)
    name: str | None = Field(default=None, max_length=255)
    initialize_git: bool = False


class CloneRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    destination: str = Field(min_length=1, max_length=4096)

    @field_validator("url")
    @classmethod
    def github_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        if not value.startswith("https://github.com/"):
            raise ValueError("Only public GitHub HTTPS URLs are supported")
        parts = value.removeprefix("https://github.com/").removesuffix(".git").split("/")
        if len(parts) != 2 or not all(parts) or any(part in {".", ".."} for part in parts):
            raise ValueError("Enter a valid GitHub repository URL")
        return f"https://github.com/{parts[0]}/{parts[1]}.git"


class OnboardingResponse(BaseModel):
    path: str
    exists: bool
    kind: Literal["folder", "file"]
    canonical_path: str | None = None
    repository_root: str | None = None
    repository_name: str | None = None
    branch: str | None = None
    is_git_repository: bool = False
    is_project: bool = False
    is_empty: bool = False
    is_registered: bool = False
    repository_id: int | None = None
    supported_file: bool | None = None
    standalone_supported: bool = False
    message: str | None = None


class CloneResponse(BaseModel):
    repository: dict
    cloned_path: str
