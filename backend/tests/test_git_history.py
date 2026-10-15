import subprocess

import pytest

from app.services.git import GitServiceError
from app.services.history import GitHistoryService


def run_git(path, *args):
    return subprocess.run(["git", *args], cwd=path, check=True, capture_output=True, text=True)


@pytest.fixture
def history_repo(tmp_path):
    run_git(tmp_path, "init", "-q")
    run_git(tmp_path, "config", "user.name", "History Test")
    run_git(tmp_path, "config", "user.email", "history@example.invalid")
    (tmp_path / "alpha.txt").write_text("one\n")
    (tmp_path / "keep.txt").write_text("keep\n")
    run_git(tmp_path, "add", ".")
    run_git(tmp_path, "commit", "-qm", "initial files")
    (tmp_path / "alpha.txt").write_text("one\ntwo\n")
    (tmp_path / "added.txt").write_text("added\n")
    run_git(tmp_path, "add", ".")
    run_git(tmp_path, "commit", "-qm", "modify and add")
    run_git(tmp_path, "mv", "alpha.txt", "renamed.txt")
    (tmp_path / "renamed.txt").write_text("one\ntwo\nthree\n")
    run_git(tmp_path, "commit", "-qam", "rename and modify")
    return tmp_path


def test_history_is_paginated_and_deterministic(history_repo):
    service = GitHistoryService()
    first = service.history(history_repo, page=1, limit=2)
    second = service.history(history_repo, page=2, limit=2)

    assert [item.subject for item in first.items] == ["rename and modify", "modify and add"]
    assert len(first.items) == 2
    assert first.has_more is True
    assert second.items[0].subject == "initial files"
    assert second.has_more is False
    assert first.items[0].sha and len(first.items[0].short_sha) == 7
    assert first.items[0].parents and first.items[0].is_merge is False


def test_commit_detail_reports_stats_and_no_patch_body(history_repo):
    sha = run_git(history_repo, "rev-parse", "HEAD").stdout.strip()
    commit = GitHistoryService().commit(history_repo, sha)

    assert commit.subject == "rename and modify"
    assert commit.changed_files == 1
    assert commit.additions >= 1
    assert commit.deletions >= 0
    assert commit.files[0].status == "renamed"
    assert not hasattr(commit, "patch")


def test_file_history_follows_rename(history_repo):
    result = GitHistoryService().file_history(history_repo, 1, "renamed.txt", limit=10)

    assert result.path == "renamed.txt"
    assert [item.subject for item in result.items] == ["rename and modify", "modify and add", "initial files"]


def test_compare_reports_changed_files_and_bounds(history_repo):
    base = run_git(history_repo, "rev-parse", "HEAD~2").stdout.strip()
    head = run_git(history_repo, "rev-parse", "HEAD").stdout.strip()
    result = GitHistoryService().compare(history_repo, base, head)

    assert result.base == base
    assert result.head == head
    assert result.commits == 2
    assert result.additions >= 2
    assert all(file.path for file in result.files)


def test_branch_and_detached_history(history_repo):
    run_git(history_repo, "branch", "feature")
    branch = GitHistoryService().history(history_repo, ref="feature", limit=1)
    assert branch.ref == "feature"
    run_git(history_repo, "checkout", "--detach", "-q")
    detached = GitHistoryService().history(history_repo, limit=1)
    assert detached.detached is True


def test_invalid_ref_and_non_git_directory_are_safe(tmp_path, history_repo):
    with pytest.raises(GitServiceError, match="Invalid ref"):
        GitHistoryService().history(history_repo, ref="does-not-exist")
    non_repo = tmp_path / "non-repo"
    non_repo.mkdir()
    with pytest.raises(GitServiceError):
        GitHistoryService().history(non_repo)


def test_empty_repository_is_reported_without_failure(tmp_path):
    run_git(tmp_path, "init", "-q")
    result = GitHistoryService().history(tmp_path)
    assert result.empty is True
    assert result.items == []


def test_special_filename_remains_data_not_command(history_repo):
    name = "$(touch-do-not-run);unicode-é.txt"
    (history_repo / name).write_text("safe\n")
    run_git(history_repo, "add", "--", name)
    run_git(history_repo, "commit", "-qm", "special filename")
    result = GitHistoryService().history(history_repo, limit=1)
    detail = GitHistoryService().commit(history_repo, result.items[0].sha)
    assert detail.files[0].path == name
    assert not (history_repo / "touch-do-not-run").exists()
