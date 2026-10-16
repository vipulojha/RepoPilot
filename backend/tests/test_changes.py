from pathlib import Path

from app import main
from tests.test_health import client_with_database


def init_repo(path: Path) -> None:
    import subprocess

    subprocess.run(["git", "init", "-q"], cwd=path, check=True)
    subprocess.run(["git", "config", "user.name", "Change Test"], cwd=path, check=True)
    subprocess.run(["git", "config", "user.email", "change@example.invalid"], cwd=path, check=True)
    (path / "source.py").write_text("def source():\n    return 1\n")
    (path / "consumer.py").write_text("from source import source\nsource()\n")
    (path / "test_source.py").write_text("from source import source\ndef test_source():\n    assert source() == 1\n")
    subprocess.run(["git", "add", "."], cwd=path, check=True)
    subprocess.run(["git", "commit", "-qm", "initial"], cwd=path, check=True)


def register_and_scan(client, repo: Path) -> int:
    created = client.post("/api/v1/repositories", json={"name": "fixture", "path": str(repo), "branch": "main"})
    assert created.status_code == 201
    repository_id = created.json()["id"]
    scan = client.post(f"/api/v1/repositories/{repository_id}/scans", json={})
    assert scan.status_code == 202
    assert scan.json()["status"] == "ready"
    return repository_id


def make_client(repo_root: Path):
    db_dir = repo_root.parent / f"{repo_root.name}-test-db"
    db_dir.mkdir(exist_ok=True)
    return client_with_database(db_dir)


def test_clean_and_unstaged_change_are_analyzed(tmp_path):
    init_repo(tmp_path)
    client = make_client(tmp_path)
    repository_id = register_and_scan(client, tmp_path)
    clean = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    assert clean["state"] == "clean"
    assert clean["changed_files"] == []
    (tmp_path / "source.py").write_text("def source():\n    return 2\n")
    changed = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    assert changed["state"] == "ready"
    assert changed["diff"]["files"] == 1
    assert changed["diff"]["additions"] == 1
    assert changed["changed_files"][0]["git"]["status"] == "modified"
    assert any(line["type"] == "del" and "return 1" in line["code"] for line in changed["changed_files"][0]["diff_lines"])
    assert any(line["type"] == "add" and "return 2" in line["code"] for line in changed["changed_files"][0]["diff_lines"])
    main.app.dependency_overrides.clear()


def test_staged_untracked_and_special_filename_remain_distinct(tmp_path):
    init_repo(tmp_path)
    client = make_client(tmp_path)
    repository_id = register_and_scan(client, tmp_path)
    import subprocess

    (tmp_path / "consumer.py").write_text("from source import source\nsource()\n# staged\n")
    subprocess.run(["git", "add", "consumer.py"], cwd=tmp_path, check=True)
    special = "$(do-not-run);é.txt"
    (tmp_path / special).write_text("safe\n")
    result = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    statuses = {item["git"]["status"] for item in result["changed_files"]}
    assert "modified" in statuses
    assert "untracked" in statuses
    assert any(item["git"]["path"] == special for item in result["changed_files"])
    assert not (tmp_path / "do-not-run").exists()
    main.app.dependency_overrides.clear()


def test_renamed_and_deleted_files_preserve_git_metadata(tmp_path):
    init_repo(tmp_path)
    client = make_client(tmp_path)
    repository_id = register_and_scan(client, tmp_path)
    import subprocess

    subprocess.run(["git", "mv", "source.py", "renamed.py"], cwd=tmp_path, check=True)
    (tmp_path / "consumer.py").unlink()
    result = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    records = {item["git"]["status"]: item for item in result["changed_files"]}
    assert records["renamed"]["git"]["rename_from"] == "source.py"
    assert records["deleted"]["git"]["path"] == "consumer.py"
    assert records["renamed"]["unresolved"] is True
    main.app.dependency_overrides.clear()


def test_change_risk_reasons_are_deterministic_and_current(tmp_path):
    init_repo(tmp_path)
    client = make_client(tmp_path)
    repository_id = register_and_scan(client, tmp_path)
    (tmp_path / "source.py").write_text("def source():\n    return 9\n")
    first = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    second = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    assert first["risk"] == second["risk"]
    assert first["snapshot_id"] is not None
    assert any("changed files" in reason for reason in first["risk"]["reasons"])
    assert first["affected_files"]
    assert isinstance(first["tests"], list)
    main.app.dependency_overrides.clear()


def test_no_ready_and_non_git_states_are_safe(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    init_repo(repo)
    client = make_client(tmp_path)
    created = client.post("/api/v1/repositories", json={"name": "repo", "path": str(repo)})
    repository_id = created.json()["id"]
    no_ready = client.get(f"/api/v1/repositories/{repository_id}/changes").json()
    assert no_ready["state"] == "no_ready_snapshot"
    non_git = tmp_path / "non-git"
    non_git.mkdir()
    other = client.post("/api/v1/repositories", json={"name": "non-git", "path": str(non_git)})
    result = client.get(f"/api/v1/repositories/{other.json()['id']}/changes").json()
    assert result["state"] in {"git_error", "not_git"}
    main.app.dependency_overrides.clear()
