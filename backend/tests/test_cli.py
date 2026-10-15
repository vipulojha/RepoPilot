import subprocess
import pytest


def git(path, *args):
    return subprocess.run(["git", *args], cwd=path, check=True, capture_output=True, text=True)


def make_fixture(tmp_path):
    git(tmp_path, "init", "-q")
    git(tmp_path, "config", "user.name", "CLI Test")
    git(tmp_path, "config", "user.email", "cli@example.invalid")
    (tmp_path / "sample.py").write_text("print('ok')\n")
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-qm", "initial")
    return tmp_path


@pytest.fixture
def fixture(tmp_path):
    return make_fixture(tmp_path)


def run_cli(*args):
    return subprocess.run(["uv", "run", "repopilot", *args], capture_output=True, text=True)


def test_cli_help_and_version():
    help_result = run_cli("--help")
    version_result = run_cli("--version")
    assert help_result.returncode == 0
    assert "history" in help_result.stdout
    assert version_result.returncode == 0
    assert version_result.stdout.startswith("repopilot ")


def test_cli_status_history_and_json(fixture):
    status = run_cli("status", "--json", str(fixture))
    history = run_cli("history", "--json", str(fixture))
    assert status.returncode == 0
    assert status.stdout.startswith("{") and '"is_git_repository"' in status.stdout
    assert history.returncode == 0
    assert '"items"' in history.stdout


def test_cli_files_search_and_invalid_path(fixture):
    files = run_cli("files", "--json", str(fixture))
    search = run_cli("search", "print", "--json", str(fixture))
    invalid = run_cli("status", str(fixture / "missing"))
    assert files.returncode == 0 and "sample.py" in files.stdout
    assert search.returncode == 0 and "sample.py" in search.stdout
    assert invalid.returncode != 0 and invalid.stderr


def test_cli_special_filename_is_data(tmp_path):
    make_fixture(tmp_path)
    name = "$(cli-no-exec);é.txt"
    (tmp_path / name).write_text("safe\n")
    result = run_cli("files", "--json", str(tmp_path))
    assert result.returncode == 0
    assert name in result.stdout
    assert not (tmp_path / "cli-no-exec").exists()
