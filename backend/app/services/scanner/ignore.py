from pathlib import Path

DEFAULT_EXCLUSIONS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env", "dist",
    "build", "coverage", ".cache", ".pytest_cache", ".mypy_cache", ".turbo", ".next",
}


class IgnorePolicy:
    def __init__(self, root: Path, patterns: list[str] | None = None):
        self.root = root
        self.patterns = patterns or []

    def should_exclude_dir(self, relative_path: str) -> bool:
        return self._excluded(relative_path, is_dir=True)

    def should_exclude_file(self, relative_path: str) -> bool:
        return self._excluded(relative_path, is_dir=False)

    def _excluded(self, relative_path: str, is_dir: bool) -> bool:
        parts = Path(relative_path).parts
        if any(part in DEFAULT_EXCLUSIONS for part in parts) or relative_path == ".gitignore":
            return True
        path = Path(relative_path).as_posix()
        ignored = False
        for raw in self.patterns:
            pattern = raw.strip()
            if not pattern or pattern.startswith("#"):
                continue
            negated = pattern.startswith("!")
            pattern = pattern[1:] if negated else pattern
            pattern = pattern.rstrip("/")
            matched = path == pattern or path.startswith(pattern + "/") or Path(path).match(pattern)
            if matched:
                ignored = not negated
        return ignored


def build_ignore_policy(root: Path) -> IgnorePolicy:
    gitignore = root / ".gitignore"
    patterns = gitignore.read_text(encoding="utf-8").splitlines() if gitignore.is_file() else []
    return IgnorePolicy(root, patterns)
