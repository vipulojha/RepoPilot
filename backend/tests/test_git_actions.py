import subprocess

import pytest

from app.services.git import GitService


def git(path, *args, check=True):
    return subprocess.run(["git", *args], cwd=path, check=check, capture_output=True, text=True)


@pytest.fixture
def action_repo(tmp_path):
    git(tmp_path, "init", "-q")
    git(tmp_path, "config", "user.name", "Action Test")
    git(tmp_path, "config", "user.email", "action@example.invalid")
    (tmp_path / "one.txt").write_text("one\n")
    (tmp_path / "two.txt").write_text("two\n")
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-qm", "initial")
    return tmp_path


def test_stage_unstage_and_selected_commit(action_repo):
    (action_repo / "one.txt").write_text("changed\n")
    (action_repo / "two.txt").write_text("also changed\n")
    service = GitService()
    assert service.action(action_repo, "stage", paths=["one.txt"])["status"] == "succeeded"
    receipt = service.action(action_repo, "commit", message="change one", paths=["one.txt"])
    assert receipt["status"] == "succeeded"
    assert "two.txt" in {item.path for item in service.status(action_repo).files}
    assert git(action_repo, "log", "-1", "--format=%s").stdout.strip() == "change one"
    assert service.action(action_repo, "stage", paths=["two.txt"])["status"] == "succeeded"
    assert service.action(action_repo, "unstage", paths=["two.txt"])["status"] == "succeeded"


def test_branch_create_and_dirty_switch_protection(action_repo):
    service = GitService()
    assert service.action(action_repo, "branch_create", name="feature/test")["status"] == "succeeded"
    assert service.action(action_repo, "branch_switch", name="feature/test")["status"] == "succeeded"
    (action_repo / "one.txt").write_text("dirty\n")
    blocked = service.action(action_repo, "branch_switch", name="main")
    assert blocked["status"] == "failed"
    assert "dirty" in blocked["message"].lower()


def test_revert_requires_confirmation_and_creates_new_commit(action_repo):
    (action_repo / "one.txt").write_text("second\n")
    git(action_repo, "commit", "-qam", "second")
    sha = git(action_repo, "rev-parse", "HEAD").stdout.strip()
    service = GitService()
    assert service.action(action_repo, "revert", commit=sha)["status"] == "failed"
    result = service.action(action_repo, "revert", commit=sha, confirm=True)
    assert result["status"] == "succeeded"
    assert git(action_repo, "log", "-1", "--format=%s").stdout.strip().startswith("Revert")


def test_invalid_paths_and_special_names_are_safe(action_repo):
    service = GitService()
    bad = service.action(action_repo, "stage", paths=["../outside"])
    assert bad["status"] == "failed"
    special = "$(not-a-command);é.txt"
    (action_repo / special).write_text("safe\n")
    result = service.action(action_repo, "stage", paths=[special])
    assert result["status"] == "succeeded"
    assert not (action_repo / "not-a-command").exists()


def test_commit_requires_explicit_selected_scope(action_repo):
    (action_repo / "one.txt").write_text("changed\n")
    git(action_repo, "add", "one.txt")
    result = GitService().action(action_repo, "commit", message="missing scope")
    assert result["status"] == "failed"
    assert "paths" in result["message"].lower()


def test_stash_create_list_apply_pop_and_drop(action_repo):
    (action_repo / "one.txt").write_text("stashed\n")
    service = GitService()
    created = service.action(action_repo, "stash_create", message="work in progress")
    assert created["status"] == "succeeded"
    listed = service.action(action_repo, "stash_list")
    assert listed["status"] == "succeeded"
    assert "stash@{0}" in listed["stdout_summary"]
    assert service.status(action_repo).clean is True
    assert service.action(action_repo, "stash_apply", stash="stash@{0}")["status"] == "succeeded"
    assert (action_repo / "one.txt").read_text() == "stashed\n"
    assert service.action(action_repo, "stash_create", message="again")["status"] == "succeeded"
    assert service.action(action_repo, "stash_pop", stash="stash@{0}")["status"] == "failed"
    assert service.action(action_repo, "stash_pop", stash="stash@{0}", confirm=True)["status"] == "succeeded"
    assert service.action(action_repo, "stash_drop", stash="stash@{0}")["status"] == "failed"


def test_invalid_stash_reference_is_rejected(action_repo):
    result = GitService().action(action_repo, "stash_apply", stash="stash@{999}")
    assert result["status"] == "failed"
    assert "stash" in result["message"].lower()
