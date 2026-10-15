import subprocess
from unittest.mock import patch

from app.services.git import GitService, GitServiceError


def git(path, *args):
    return subprocess.run(["git", *args], cwd=path, check=True, capture_output=True, text=True)


def test_git_status_reports_head_and_worktree(tmp_path):
    git(tmp_path, "init", "-q")
    git(tmp_path, "config", "user.name", "RepoPilot Test")
    git(tmp_path, "config", "user.email", "test@example.invalid")
    (tmp_path / "tracked.txt").write_text("one\n")
    git(tmp_path, "add", "tracked.txt")
    git(tmp_path, "commit", "-qm", "initial commit")
    (tmp_path / "tracked.txt").write_text("two\n")
    (tmp_path / "new.txt").write_text("new\n")

    result = GitService().status(tmp_path)

    assert result.branch in {"main", "master"}
    assert result.head and result.head.message == "initial commit"
    assert result.clean is False
    assert result.unstaged_count == 1
    assert result.untracked_count == 1
    assert {item.status for item in result.files} == {"modified", "untracked"}


def test_git_status_sanitizes_remote_credentials(tmp_path):
    git(tmp_path, "init", "-q")
    git(tmp_path, "remote", "add", "origin", "https://user:secret@example.com/repo.git")

    result = GitService().status(tmp_path)

    assert result.remotes[0].fetch_url == "https://user@example.com/repo.git"
    assert "secret" not in result.remotes[0].fetch_url


def test_git_status_rejects_non_git_directory(tmp_path):
    try:
        GitService().status(tmp_path)
    except GitServiceError as exc:
        assert "Git repository" in str(exc)
    else:
        raise AssertionError("expected non-Git directory to be rejected")


def test_git_status_reports_missing_git(tmp_path):
    with patch("app.services.git.shutil.which", return_value=None):
        try:
            GitService().status(tmp_path)
        except GitServiceError as exc:
            assert str(exc) == "Git executable is not available"
        else:
            raise AssertionError("expected missing Git to be reported")


def test_git_status_enforces_repository_root(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    git(repo, "init", "-q")
    try:
        GitService().status(tmp_path)
    except GitServiceError as exc:
        assert "repository root" in str(exc)
    else:
        raise AssertionError("expected parent path to be rejected")
