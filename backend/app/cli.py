"""RepoPilot's bounded, read-only terminal interface."""
import argparse
import json
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.db.database import Base
from app.db.models import Dependency, Repository, RepositoryFile, ScanSnapshot, Symbol
from app.services.changes import ChangeIntelligenceService
from app.services.git import GitService, GitServiceError
from app.services.graph import project_graph
from app.services.history import GitHistoryService
from app.services.hotspots import calculate_hotspots
from app.services.impact import analyze_impact
from app.services.scans import create_scan_snapshot, latest_ready, run_scan
from app.services.search import search_documents
from app.services.test_relationships import relationships
from app.services.scanner.scanner import ScanLimits

VERSION = "0.2.0"


def _dump(value):
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if isinstance(value, list): return [_dump(x) for x in value]
    if isinstance(value, dict): return {k: _dump(v) for k, v in value.items()}
    return value


def emit(value, as_json):
    value = _dump(value)
    if as_json:
        print(json.dumps(value, ensure_ascii=False, default=str))
    elif isinstance(value, dict):
        for key, item in value.items(): print(f"{key}: {item}")
    elif isinstance(value, list):
        for item in value: print(item)
    else: print(value)


def _limit(value, maximum):
    if value < 1: raise ValueError("limit must be positive")
    return min(value, maximum)


def _root(path):
    root = Path(path).expanduser().resolve(strict=True)
    if not root.is_dir(): raise ValueError("repository path is not a directory")
    return root


def _parser():
    p = argparse.ArgumentParser(prog="repopilot", description="RepoPilot local Git intelligence CLI")
    p.add_argument("--version", action="version", version=f"repopilot {VERSION}")
    p.add_argument("--database", help="SQLite database path (default: temporary per invocation)")
    sub = p.add_subparsers(dest="command", required=True)
    def add(name, **kwargs):
        x = sub.add_parser(name, **kwargs); x.add_argument("path", nargs="?", default="."); x.add_argument("--json", action="store_true"); return x
    add("status"); add("summary"); add("files").add_argument("--limit", type=int, default=100)
    x = sub.add_parser("search", help="search repository text"); x.add_argument("query"); x.add_argument("path", nargs="?", default="."); x.add_argument("--json", action="store_true"); x.add_argument("--limit", type=int, default=50)
    for name in ("symbols", "dependencies", "hotspots", "tests"): add(name).add_argument("--limit", type=int, default=100)
    x = add("impact"); x.add_argument("file_id", type=int); x.add_argument("--depth", type=int, default=3)
    x = add("graph"); x.add_argument("file_id", type=int); x.add_argument("--direction", choices=("both", "incoming", "outgoing"), default="both"); x.add_argument("--depth", type=int, default=2); x.add_argument("--limit", type=int, default=100)
    x = add("history"); x.add_argument("--limit", type=int, default=20); x.add_argument("--ref")
    x = add("details"); x.add_argument("sha")
    x = add("file-history"); x.add_argument("relative"); x.add_argument("--file-id", type=int, default=0); x.add_argument("--limit", type=int, default=20)
    x = add("compare"); x.add_argument("base"); x.add_argument("head")
    add("changes"); add("git-status")
    x = sub.add_parser("git", help="Git intelligence commands"); x.add_argument("git_command", choices=("status",)); x.add_argument("path", nargs="?", default="."); x.add_argument("--json", action="store_true")
    x = add("scan"); x.add_argument("scan_command", nargs="?", choices=("status", "run"), default="run")
    return p


def main(argv=None):
    args = _parser().parse_args(argv)
    try:
        root = _root(args.path)
        db_path = args.database or os.path.join(os.environ.get("TMPDIR", "/tmp"), f"repopilot-{os.getpid()}.db")
        engine = create_engine(f"sqlite:///{Path(db_path).resolve()}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            repo = db.scalar(select(Repository).where(Repository.path == str(root)))
            if repo is None:
                repo = Repository(name=root.name, path=str(root)); db.add(repo); db.commit(); db.refresh(repo)
            ready = latest_ready(db, repo.id)
            if args.command == "scan":
                if args.scan_command == "status": value = {"repository_id": repo.id, "latest": ready}
                else:
                    snapshot = run_scan(db, create_scan_snapshot(db, repo.id).id, ScanLimits()); value = snapshot
            elif args.command in {"status", "git-status", "git"}: value = GitService().status(root)
            elif args.command == "changes": value = ChangeIntelligenceService().analyze(db, repo.id, str(root))
            elif args.command == "history": value = GitHistoryService().history(root, limit=_limit(args.limit, 100), ref=args.ref)
            elif args.command == "details": value = GitHistoryService().commit(root, args.sha)
            elif args.command == "file-history": value = GitHistoryService().file_history(root, args.file_id, args.relative, limit=_limit(args.limit, 100))
            elif args.command == "compare": value = GitHistoryService().compare(root, args.base, args.head)
            elif args.command == "files" and ready is None:
                paths = sorted(str(p.relative_to(root)) for p in root.rglob("*") if p.is_file() and ".git" not in p.parts)
                value = {"items": paths[:_limit(args.limit, 500)], "truncated": len(paths) > args.limit}
            elif args.command == "search" and ready is None:
                matches = []
                for path in root.rglob("*"):
                    if len(matches) >= _limit(args.limit, 200) or not path.is_file() or ".git" in path.parts: continue
                    try: lines = path.read_text(errors="replace").splitlines()
                    except OSError: continue
                    for number, line in enumerate(lines, 1):
                        if args.query.lower() in line.lower(): matches.append({"path": str(path.relative_to(root)), "line": number, "text": line[:500]})
                        if len(matches) >= args.limit: break
                value = {"query": args.query, "items": matches}
            else:
                if ready is None: raise ValueError("No READY snapshot; run 'scan' first")
                if args.command == "summary":
                    files = db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == ready.id)).all()
                    value = {"snapshot_id": ready.id, "file_count": len(files), "total_lines": sum(x.line_count or 0 for x in files), "total_bytes": sum(x.size_bytes for x in files), "symbol_count": db.scalar(select(func.count(Symbol.id)).where(Symbol.snapshot_id == ready.id)) or 0}
                elif args.command == "files":
                    rows = db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == ready.id).limit(_limit(args.limit, 500))).all(); value = {"items": rows}
                elif args.command == "search": value = search_documents(db, ready.id, args.query, limit=_limit(args.limit, 200))
                elif args.command == "symbols": value = db.scalars(select(Symbol).where(Symbol.snapshot_id == ready.id).limit(_limit(args.limit, 500))).all()
                elif args.command == "dependencies": value = db.scalars(select(Dependency).where(Dependency.snapshot_id == ready.id).limit(_limit(args.limit, 500))).all()
                elif args.command == "hotspots": value = calculate_hotspots(db, ready.id)[:_limit(args.limit, 500)]
                elif args.command == "impact": value = analyze_impact(db, ready.id, [args.file_id], min(max(args.depth, 0), 6))
                elif args.command == "graph": value = project_graph(db, ready.id, args.file_id, args.direction, min(max(args.depth, 0), 6), _limit(args.limit, 500), _limit(args.limit * 2, 1000))
                else: value = relationships(db, ready.id, args.file_id, "source")
        emit(value, args.json); return 0
    except (GitServiceError, OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr); return 1


if __name__ == "__main__": raise SystemExit(main())
