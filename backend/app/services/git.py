import re
import shutil
import subprocess
from pathlib import Path

from app.schemas.git import GitFileStatus, GitRemote, GitStatusResponse, GitUpstream


class GitServiceError(Exception):
    """A safe, user-facing Git inspection failure."""


class GitService:
    def __init__(self, *, timeout: float = 5.0, max_output: int = 1_000_000):
        self.timeout = timeout
        self.max_output = max_output

    def status(self, repository_path: str | Path) -> GitStatusResponse:
        root = self._validate_root(repository_path)
        branch = self._run(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], check=False).strip()
        sha = self._run(root, ["rev-parse", "--verify", "HEAD"], check=False).strip() or None
        detached = not bool(branch)
        upstream = self._run(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], check=False).strip() or None
        ahead, behind = self._ahead_behind(root, upstream)
        files = self._files(self._run(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]))
        remotes = self._remotes(root)
        head = self._head(root, sha) if sha else None
        shallow = self._run(root, ["rev-parse", "--is-shallow-repository"], check=False).strip() == "true"
        local_branches = self._refs(root, "refs/heads/")
        tags = self._refs(root, "refs/tags/")
        upstream_data = GitUpstream(name=upstream, ahead=ahead, behind=behind) if upstream else None
        return GitStatusResponse(branch=branch or None, head=head, detached=detached, upstream=upstream_data,
                                 ahead=ahead, behind=behind, diverged=bool(ahead and behind), shallow=shallow,
                                 files=files, remotes=remotes, local_branches=local_branches, tags=tags,
                                 clean=not files, staged_count=sum(f.index != " " for f in files),
                                 unstaged_count=sum(f.worktree not in (" ", "?") for f in files),
                                 untracked_count=sum(f.status == "untracked" for f in files),
                                 deleted_count=sum("D" in (f.index, f.worktree) for f in files),
                                 conflicted_count=sum(f.conflict for f in files))

    def _validate_root(self, value: str | Path) -> Path:
        executable = shutil.which("git")
        if executable is None:
            raise GitServiceError("Git executable is not available")
        try:
            root = Path(value).expanduser().resolve(strict=True)
        except (OSError, RuntimeError) as exc:
            raise GitServiceError("Repository path is invalid") from exc
        if not root.is_dir():
            raise GitServiceError("Repository path is not a directory")
        actual = self._run(root, ["rev-parse", "--show-toplevel"], check=False).strip()
        if not actual or Path(actual).resolve() != root:
            raise GitServiceError("Path is not a Git repository root")
        return root

    def _run(self, cwd: Path, args: list[str], *, check: bool = True) -> str:
        try:
            result = subprocess.run(["git", "-c", f"safe.directory={cwd}", *args], cwd=cwd, text=True, capture_output=True,
                                    timeout=self.timeout, check=False)
        except subprocess.TimeoutExpired as exc:
            raise GitServiceError("Git command timed out") from exc
        except OSError as exc:
            raise GitServiceError("Unable to execute Git") from exc
        output = result.stdout[: self.max_output]
        if check and result.returncode:
            raise GitServiceError("Git command failed")
        return output

    def _ahead_behind(self, root: Path, upstream: str | None) -> tuple[int, int]:
        if not upstream:
            return 0, 0
        raw = self._run(root, ["rev-list", "--left-right", "--count", f"HEAD...{upstream}"], check=False).split()
        return (int(raw[0]), int(raw[1])) if len(raw) == 2 and all(x.isdigit() for x in raw) else (0, 0)

    @staticmethod
    def _files(raw: str) -> list[GitFileStatus]:
        result = []
        records = raw.split("\0")
        i = 0
        while i < len(records) and records[i]:
            record = records[i]
            xy, path = record[:2], record[3:]
            rename_from = None
            if xy[0] in "RC" or xy[1] in "RC":
                if i + 1 < len(records):
                    rename_from, i = records[i + 1], i + 1
            conflict = xy in {"DD", "AU", "UD", "UA", "DU", "AA", "UU"}
            status = "untracked" if xy == "??" else "renamed" if "R" in xy else "deleted" if "D" in xy else "modified"
            result.append(GitFileStatus(path=path, status=status, index=xy[0], worktree=xy[1], rename_from=rename_from, conflict=conflict))
            i += 1
        return result

    def _remotes(self, root: Path) -> list[GitRemote]:
        values: dict[str, dict[str, str]] = {}
        for line in self._run(root, ["remote", "-v"], check=False).splitlines():
            match = re.match(r"^(\S+)\s+(\S+)\s+\((fetch|push)\)$", line)
            if match:
                name, url, kind = match.groups()
                values.setdefault(name, {})[f"{kind}_url"] = self._sanitize(url)
        return [GitRemote(name=name, fetch_url=data.get("fetch_url", ""), push_url=data.get("push_url", ""))
                for name, data in values.items()]

    def _head(self, root: Path, sha: str):
        raw = self._run(root, ["show", "-s", "--format=%H%x00%h%x00%s%x00%an%x00%cI", sha], check=False)
        parts = raw.rstrip("\n").split("\0")
        from app.schemas.git import GitHead
        return GitHead(sha=parts[0], short_sha=parts[1], message=parts[2], author=parts[3], committed_at=parts[4])

    def _refs(self, root: Path, prefix: str) -> list[str]:
        raw = self._run(root, ["for-each-ref", "--format=%(refname:strip=2)", prefix], check=False)
        return [line for line in raw.splitlines() if line]

    @staticmethod
    def _sanitize(url: str) -> str:
        return re.sub(r"(://[^/:@]+):[^@]+@", r"\1@", url)
