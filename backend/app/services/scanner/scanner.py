from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

from app.services.scanner.classifier import FileClassification, classify_file
from app.services.scanner.ignore import IgnorePolicy
from app.services.scanner.metadata import FileMetadata, extract_metadata


@dataclass(frozen=True)
class ScanLimits:
    max_file_bytes: int = 2_000_000
    max_files: int = 50_000


@dataclass(frozen=True)
class DiscoveredFile:
    path: Path
    relative_path: str


def resolve_repository_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve(strict=True)
    if not root.is_dir():
        raise ValueError("Repository path must be a directory")
    return root


def safe_relative_path(root: Path, path: Path) -> str:
    resolved = path.resolve(strict=False)
    try:
        relative = resolved.relative_to(root.resolve())
    except ValueError as exc:
        raise ValueError("Path escapes repository root") from exc
    return relative.as_posix()


def discover_files(root: Path, policy: IgnorePolicy, limits: ScanLimits) -> Iterator[DiscoveredFile]:
    root = root.resolve(strict=True)
    found = 0
    stack = [root]
    while stack:
        directory = stack.pop()
        try:
            entries = sorted(directory.iterdir(), key=lambda entry: entry.name.lower(), reverse=True)
        except OSError:
            continue
        for entry in entries:
            try:
                relative = safe_relative_path(root, entry)
                if entry.is_dir() and not entry.is_symlink():
                    if not policy.should_exclude_dir(relative):
                        stack.append(entry)
                elif entry.is_file() and not policy.should_exclude_file(relative):
                    yield DiscoveredFile(entry, relative)
                    found += 1
                    if found >= limits.max_files:
                        return
            except (OSError, ValueError):
                continue


def metadata_for_file(root: Path, path: Path, limits: ScanLimits) -> FileMetadata:
    classification: FileClassification = classify_file(path, limits.max_file_bytes)
    return extract_metadata(root, path, classification)
