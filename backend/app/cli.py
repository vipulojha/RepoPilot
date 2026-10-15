"""Small local CLI adapter over RepoPilot's Git intelligence services."""
import argparse
import json
import sys
from pathlib import Path

from app.services.git import GitService, GitServiceError
from app.services.history import GitHistoryService

VERSION = "0.1.0"


def emit(value, as_json: bool) -> None:
    if as_json:
        print(json.dumps(value, default=lambda item: item.model_dump() if hasattr(item, "model_dump") else str(item), ensure_ascii=False))
    else:
        if isinstance(value, dict):
            for key, item in value.items(): print(f"{key}: {item}")
        elif isinstance(value, list):
            for item in value: print(item)
        else: print(value)


def root_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("path", nargs="?", default=".", help="repository path (default: current directory)")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="repopilot", description="RepoPilot local Git intelligence CLI")
    parser.add_argument("--version", action="version", version=f"repopilot {VERSION}")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("status", "changes"):
        command = sub.add_parser(name, help=f"show current Git {name}")
        root_arg(command)
    history = sub.add_parser("history", help="show bounded commit history")
    root_arg(history); history.add_argument("--limit", type=int, default=20)
    files = sub.add_parser("files", help="list repository files")
    root_arg(files); files.add_argument("--limit", type=int, default=100)
    search = sub.add_parser("search", help="search repository text")
    search.add_argument("query"); root_arg(search); search.add_argument("--limit", type=int, default=50)
    git_group = sub.add_parser("git", help="Git intelligence commands")
    git_sub = git_group.add_subparsers(dest="git_command", required=True)
    git_status = git_sub.add_parser("status", help="show Git status")
    root_arg(git_status)
    args = parser.parse_args(argv)
    try:
        root = Path(args.path).expanduser().resolve(strict=True)
        service = GitService()
        if args.command in {"status", "changes"} or args.command == "git":
            value = service.status(root).model_dump()
        elif args.command == "history":
            value = GitHistoryService().history(root, limit=max(1, min(args.limit, 100))).model_dump()
        elif args.command == "files":
            paths = [str(path.relative_to(root)) for path in root.rglob("*") if path.is_file() and ".git" not in path.parts]
            value = {"items": sorted(paths)[:max(1, min(args.limit, 500))], "truncated": len(paths) > args.limit}
        elif args.command == "search":
            matches = []
            for path in root.rglob("*"):
                if len(matches) >= min(args.limit, 100) or not path.is_file() or ".git" in path.parts: continue
                try: lines = path.read_text(errors="replace").splitlines()
                except OSError: continue
                for number, line in enumerate(lines, 1):
                    if args.query.lower() in line.lower(): matches.append({"path": str(path.relative_to(root)), "line": number, "text": line[:500]})
                    if len(matches) >= min(args.limit, 100): break
            value = {"query": args.query, "items": matches}
        emit(value, args.json)
        return 0
    except (GitServiceError, OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
