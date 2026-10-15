import re
import shutil
import subprocess
import threading
from pathlib import Path

from app.schemas.git import GitFileStatus, GitRemote, GitStatusResponse, GitUpstream


class GitServiceError(Exception):
    """A safe, user-facing Git inspection failure."""


class GitService:
    _locks: dict[str, threading.Lock] = {}
    _locks_guard = threading.Lock()
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

    def current_changes(self, repository_path: str | Path) -> GitStatusResponse:
        """Return current status plus bounded tracked-file diff statistics."""
        result = self.status(repository_path)
        root = self._validate_root(repository_path)
        raw = self._run(root, ["diff", "HEAD", "--numstat", "-z", "-M", "--", "."], check=False)
        records = raw.split("\0")
        by_path = {item.path: item for item in result.files}
        index = 0
        while index < len(records):
            parts = records[index].split("\t")
            index += 1
            if len(parts) != 3:
                continue
            additions, deletions, path = parts
            if not path and index + 1 < len(records):
                index += 2
                path = records[index - 1]
            item = by_path.get(path)
            if item:
                item.additions = 0 if additions == "-" else int(additions)
                item.deletions = 0 if deletions == "-" else int(deletions)
        return result

    def action(self, repository_path: str | Path, action: str, **kwargs):
        root = self._validate_root(repository_path)
        with self._lock(root):
            before = self.status(root)
            if before.conflicted_count:
                return self._receipt(action, "conflict", "Resolve repository conflicts first", root)
            try:
                args: list[str]
                if action in {"stage", "unstage"}:
                    paths = self._paths(root, kwargs.get("paths", []))
                    if not paths: raise GitServiceError("At least one repository-relative path is required")
                    args = ["add"] if action == "stage" else ["reset", "--"]
                    if action == "stage": args += ["--"]
                    args += paths
                elif action == "commit":
                    message = (kwargs.get("message") or "").strip()
                    if not message: raise GitServiceError("Commit message is required")
                    if not before.staged_count: raise GitServiceError("No staged changes to commit")
                    paths = self._paths(root, kwargs.get("paths", []))
                    if not paths: raise GitServiceError("Select staged paths before committing")
                    args = ["commit", "--no-verify", "-m", message, "--", *paths]
                elif action == "branch_create":
                    name = self._branch(kwargs.get("name")); start = kwargs.get("start_point") or "HEAD"
                    self._verify_commitish(root, start)
                    args = ["branch", name, start]
                elif action == "branch_switch":
                    name = self._branch(kwargs.get("name"))
                    if not before.clean and not kwargs.get("confirm_dirty"): raise GitServiceError("Working tree is dirty; confirm_dirty is required")
                    args = ["switch", name]
                elif action == "revert":
                    if not kwargs.get("confirm"): raise GitServiceError("Revert confirmation is required")
                    commit = self._commit(root, kwargs.get("commit")); args = ["revert", "--no-edit", commit]
                elif action in {"fetch", "push", "pull"}:
                    remote = self._remote(root, kwargs.get("remote")); branch = kwargs.get("branch")
                    if action in {"push", "pull"} and branch: self._branch(branch)
                    if action == "fetch": args = ["fetch", "--", remote]
                    elif action == "push": args = ["push", "--no-follow-tags", "--", remote, branch or before.branch or "HEAD"]
                    else: args = ["pull", "--ff-only", "--", remote, branch or before.branch or "HEAD"]
                else: raise GitServiceError("Unsupported Git action")
                output = self._run(root, args)
                return self._receipt(action, "succeeded", "Git action completed", root, output)
            except GitServiceError as exc:
                return self._receipt(action, "conflict" if "conflict" in str(exc).lower() else "failed", str(exc), root)

    @classmethod
    def _lock(cls, root: Path):
        with cls._locks_guard: cls._locks.setdefault(str(root), threading.Lock()); return cls._locks[str(root)]
    def _paths(self, root, paths):
        if not paths: return []
        for path in paths:
            if not path or path.startswith("/") or ".." in Path(path).parts or "\\" in path: raise GitServiceError("Invalid repository-relative path")
        return paths
    def _branch(self, name):
        if not name: raise GitServiceError("Branch name is required")
        if subprocess.run(["git", "check-ref-format", "--branch", name], capture_output=True, text=True).returncode: raise GitServiceError("Invalid branch name")
        return name
    def _remote(self, root, name):
        if not name or name not in [r.name for r in self._remotes(root)]: raise GitServiceError("Unknown remote")
        return name
    def _verify_commitish(self, root, value):
        self._run(root, ["rev-parse", "--verify", f"{value}^{{commit}}"]); return value
    def _commit(self, root, value):
        if not value or any(c in value for c in " \t\n") or len(value) > 100: raise GitServiceError("Invalid commit identifier")
        return self._run(root, ["rev-parse", "--verify", f"{value}^{{commit}}"]).strip()
    def _receipt(self, action, status, message, root, output=""):
        refreshed = self.status(root)
        return {"action": action, "status": status, "message": message,
                "recovery_guidance": "Resolve the repository state manually before retrying." if status == "conflict" else None,
                "git": refreshed, "status_refresh": refreshed,
                "intelligence_stale": status == "succeeded", "stdout_summary": output[:2000]}

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
            status = ("untracked" if xy == "??" else "renamed" if "R" in xy else "copied" if "C" in xy else "added" if "A" in xy else "deleted" if "D" in xy else "modified")
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
