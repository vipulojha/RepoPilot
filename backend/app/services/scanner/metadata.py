from dataclasses import dataclass
from pathlib import Path

from app.services.scanner.classifier import FileClassification
from app.services.scanner.language import detect_language


@dataclass(frozen=True)
class FileMetadata:
    relative_path: str
    name: str
    extension: str
    language: str
    size_bytes: int
    line_count: int | None
    is_binary: bool
    is_test: bool
    warning: str | None = None


def _is_test(path: str) -> bool:
    parts = [part.lower() for part in Path(path).parts]
    stem = Path(path).stem.lower()
    return any(part in {"test", "tests"} for part in parts) or stem.endswith((".test", ".spec", "_test", "test"))


def extract_metadata(root: Path, path: Path, classification: FileClassification) -> FileMetadata:
    relative = path.relative_to(root).as_posix()
    size = path.stat().st_size
    extension = path.suffix.lower()
    lines: int | None = None
    warning = classification.reason
    if classification.kind == "TEXT":
        try:
            data = path.read_bytes()
            lines = len(data.decode("utf-8", errors="replace").replace("\r\n", "\n").replace("\r", "\n").splitlines())
        except OSError as exc:
            warning = str(exc)
    return FileMetadata(relative, path.name, extension, detect_language(path.name), size, lines, classification.is_binary, _is_test(relative), warning)
