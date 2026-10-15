from pathlib import Path

import pytest

from app.services.scanner.ignore import build_ignore_policy
from app.services.scanner.scanner import ScanLimits, discover_files, resolve_repository_root, safe_relative_path


def test_discovery_excludes_defaults_and_gitignore(tmp_path: Path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "ok.py").write_text("print(1)\n")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "bad.js").write_text("bad")
    (tmp_path / "ignored.txt").write_text("ignored")
    (tmp_path / ".gitignore").write_text("ignored.txt\n")
    paths = [item.relative_path for item in discover_files(tmp_path, build_ignore_policy(tmp_path), ScanLimits())]
    assert paths == ["src/ok.py"]


def test_symlink_escape_is_not_followed(tmp_path: Path):
    outside = tmp_path.parent / f"{tmp_path.name}-outside"
    outside.mkdir(exist_ok=True)
    (outside / "secret.txt").write_text("secret")
    link = tmp_path / "escape"
    link.symlink_to(outside, target_is_directory=True)
    assert list(discover_files(tmp_path, build_ignore_policy(tmp_path), ScanLimits())) == []


def test_safe_relative_path_rejects_escape(tmp_path: Path):
    with pytest.raises(ValueError):
        safe_relative_path(tmp_path, tmp_path / ".." / "outside")


def test_language_and_metadata_classification(tmp_path: Path):
    file = tmp_path / "tests" / "sample.test.ts"
    file.parent.mkdir()
    file.write_bytes(b"a\r\nb\rc\n")
    item = next(discover_files(tmp_path, build_ignore_policy(tmp_path), ScanLimits()))
    from app.services.scanner.scanner import metadata_for_file
    metadata = metadata_for_file(tmp_path, item.path, ScanLimits())
    assert metadata.relative_path == "tests/sample.test.ts"
    assert metadata.language == "TypeScript"
    assert metadata.line_count == 3
    assert metadata.is_test is True
