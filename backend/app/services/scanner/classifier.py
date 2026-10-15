from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class FileClassification:
    kind: str
    is_binary: bool
    reason: str | None = None


def classify_file(path: Path, max_file_bytes: int) -> FileClassification:
    try:
        size = path.stat().st_size
        if size > max_file_bytes:
            return FileClassification("SKIPPED", False, "file exceeds configured size limit")
        sample = path.read_bytes()[:8192]
        if b"\x00" in sample:
            return FileClassification("BINARY", True, "binary content")
        return FileClassification("TEXT", False)
    except OSError as exc:
        return FileClassification("SKIPPED", False, str(exc))
