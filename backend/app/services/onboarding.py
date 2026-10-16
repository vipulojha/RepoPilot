import re
import shutil
import subprocess
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Repository
from app.schemas.onboarding import CloneRequest, InspectRequest, OnboardingResponse


class OnboardingError(ValueError):
    pass


class OnboardingService:
    timeout = 20

    def inspect(self, db: Session, request: InspectRequest) -> OnboardingResponse:
        path = Path(self._normalize_path(request.path)).expanduser()
        if not path.exists():
            return OnboardingResponse(path=request.path, exists=False, kind=request.kind, message="Path does not exist")
        canonical = path.resolve()
        if request.kind == "file" and not canonical.is_file():
            raise OnboardingError("Selected path is not a file")
        if request.kind == "folder" and not canonical.is_dir():
            raise OnboardingError("Selected path is not a folder")
        root = self._git_root(canonical if canonical.is_dir() else canonical.parent)
        if root is None and request.kind == "file":
            supported = self._supported_file(canonical)
            return OnboardingResponse(path=request.path, exists=True, kind=request.kind, canonical_path=str(canonical),
                                      supported_file=supported, standalone_supported=supported,
                                      message="Standalone file; repository intelligence is unavailable")
        project_root = root or canonical
        registered = db.scalar(select(Repository).where(Repository.path == str(project_root)))
        branch = self._git(project_root, ["symbolic-ref", "--quiet", "--short", "HEAD"], check=False).strip() if root else None
        children = list(project_root.iterdir()) if project_root.is_dir() else []
        return OnboardingResponse(path=request.path, exists=True, kind=request.kind, canonical_path=str(canonical),
                                  repository_root=str(root) if root else str(project_root),
                                  repository_name=project_root.name, branch=branch or None,
                                  is_git_repository=root is not None, is_project=bool(children),
                                  is_empty=not children, is_registered=registered is not None,
                                  repository_id=registered.id if registered else None,
                                  supported_file=self._supported_file(canonical) if canonical.is_file() else None)

    def onboard(self, db: Session, path: str, name: str | None, initialize_git: bool) -> Repository:
        selected = Path(self._normalize_path(path)).expanduser().resolve(strict=True)
        root = self._git_root(selected if selected.is_dir() else selected.parent)
        if root is None and initialize_git:
            if not selected.is_dir():
                raise OnboardingError("Git can only be initialized for a folder")
            self._git(selected, ["init"])
            root = selected
        root = root or selected
        existing = db.scalar(select(Repository).where(Repository.path == str(root)))
        if existing:
            return existing
        branch = self._git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], check=False).strip() or "main"
        repository = Repository(name=name or root.name, path=str(root), branch=branch)
        db.add(repository); db.commit(); db.refresh(repository)
        return repository

    def clone(self, db: Session, request: CloneRequest) -> Repository:
        identity = self._github_identity(request.url)
        for candidate in db.scalars(select(Repository)).all():
            try:
                remotes = self._git(Path(candidate.path), ["remote", "get-url", "origin"], check=False).strip()
                if remotes and self._github_identity(remotes) == identity: return candidate
            except OnboardingError: continue
        destination = Path(request.destination).expanduser().resolve()
        if destination.exists():
            if any(destination.iterdir()):
                raise OnboardingError("Clone destination already exists and is not empty")
            raise OnboardingError("Clone destination already exists")
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            self._git(destination.parent, ["clone", "--", request.url, str(destination.name)])
        except Exception:
            if destination.exists() and not any(destination.iterdir()): destination.rmdir()
            raise OnboardingError("Git could not clone this repository. Check the URL and configured credentials.")
        return self.onboard(db, str(destination), destination.name, False)

    def _git_root(self, path: Path) -> Path | None:
        if shutil.which("git") is None: return None
        raw = self._git(path, ["rev-parse", "--show-toplevel"], check=False).strip()
        return Path(raw).resolve() if raw else None

    def _git(self, cwd: Path, args: list[str], check: bool = True) -> str:
        try:
            result = subprocess.run(["git", "-c", f"safe.directory={cwd}", *args], cwd=cwd,
                                    capture_output=True, text=True, timeout=self.timeout, check=False)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise OnboardingError("Git inspection timed out or is unavailable") from exc
        if check and result.returncode:
            raise OnboardingError("Git operation failed")
        return result.stdout[:2000]

    @staticmethod
    def _supported_file(path: Path) -> bool:
        return path.is_file() and path.stat().st_size <= 2_000_000 and path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip"}

    @staticmethod
    def _normalize_path(value: str) -> str:
        match = re.match(r"^([A-Za-z]):[\\/](.*)$", value.strip())
        return f"/mnt/{match.group(1).lower()}/{match.group(2).replace(chr(92), '/') }" if match else value

    @staticmethod
    def _github_identity(value: str) -> str:
        value = value.strip().rstrip("/").removesuffix(".git")
        match = re.search(r"github\.com[/:]([^/]+)/([^/]+)$", value)
        return f"{match.group(1).lower()}/{match.group(2).lower()}" if match else ""
