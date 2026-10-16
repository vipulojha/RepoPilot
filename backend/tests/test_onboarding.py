import subprocess

from app.services.onboarding import OnboardingService
from app.schemas.onboarding import CloneRequest, InspectRequest


def test_inspect_detects_nested_git_root(tmp_path):
    root = tmp_path / "project"; nested = root / "src"; nested.mkdir(parents=True)
    (nested / "main.py").write_text("print(1)\n")
    subprocess.run(["git", "init", "-q", str(root)], check=True)
    result = OnboardingService().inspect(_db(), InspectRequest(kind="file", path=str(nested / "main.py")))
    assert result.repository_root == str(root.resolve())
    assert result.is_git_repository


def test_inspect_standalone_file(tmp_path):
    file = tmp_path / "script.py"; file.write_text("print(1)\n")
    result = OnboardingService().inspect(_db(), InspectRequest(kind="file", path=str(file)))
    assert result.repository_root is None
    assert result.standalone_supported


def test_clone_url_validation():
    assert CloneRequest(url="https://github.com/org/repo/", destination="/tmp/repo").url.endswith("org/repo.git")
    try: CloneRequest(url="https://evil.example/repo", destination="/tmp/repo")
    except ValueError: pass
    else: raise AssertionError("non-GitHub URL accepted")


def test_windows_path_normalizes_for_wsl():
    assert OnboardingService._normalize_path(r"C:\ohman\src") == "/mnt/c/ohman/src"


class _DB:
    def scalar(self, _): return None


def _db(): return _DB()
