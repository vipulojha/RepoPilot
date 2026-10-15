from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import RepositoryFile
from app.schemas.changes import ChangeDiffStats, ChangeResponse, ChangeRisk, ChangedFileAnalysis
from app.services.git import GitService, GitServiceError
from app.services.hotspots import calculate_hotspots
from app.services.impact import analyze_impact
from app.services.scans import latest_ready
from app.services.test_relationships import relationships

MAX_FILES = 200
MAX_RESULTS = 100

class ChangeIntelligenceService:
    def __init__(self, git: GitService | None = None): self.git = git or GitService(max_output=500_000)

    def analyze(self, db: Session, repository_id: int, repository_path: str, max_depth: int = 3, limit: int = 100) -> ChangeResponse:
        try: status = self.git.current_changes(repository_path)
        except GitServiceError as exc:
            state = "not_git" if "Git repository root" in str(exc) else "git_error"
            return self._empty(repository_id, state)
        files = sorted(status.files, key=lambda item: (item.path, item.rename_from or ""))[:min(MAX_FILES, limit)]
        diff = ChangeDiffStats(files=len(files), additions=sum(f.additions for f in files), deletions=sum(f.deletions for f in files))
        snapshot = latest_ready(db, repository_id)
        if snapshot is None:
            return ChangeResponse(state="no_ready_snapshot", repository_id=repository_id, git=status, diff=diff,
                changed_files=[ChangedFileAnalysis(git=f) for f in files], risk=self._risk(0, 0, 0, diff, 0, 0))
        by_path = {f.relative_path: f for f in db.scalars(select(RepositoryFile).where(RepositoryFile.snapshot_id == snapshot.id)).all()}
        changed = [ChangedFileAnalysis(git=f, file_id=by_path.get(f.path).id if f.path in by_path else None, unresolved=f.path not in by_path) for f in files]
        roots = sorted({x.file_id for x in changed if x.file_id is not None})
        affected = analyze_impact(db, snapshot.id, roots, max_depth)[:min(MAX_RESULTS, limit)]
        ids = set(roots) | {item.file_id for item in affected}
        hotspots = [x for x in calculate_hotspots(db, snapshot.id) if x.file_id in ids][:min(MAX_RESULTS, limit)]
        tests = []
        for file_id in roots: tests.extend(relationships(db, snapshot.id, file_id, "source"))
        tests = sorted({(x.test_file_id, x.source_file_id): x for x in tests}.values(), key=lambda x: (x.source_path, x.test_path))[:min(MAX_RESULTS, limit)]
        risk = self._risk(len(roots), sum(x.depth == 1 for x in affected), len(affected), diff, max((x.score for x in hotspots), default=0), len(tests))
        if any(item.status == "deleted" for item in files): risk.reasons.append("deleted file has no current source mapping")
        if any(item.status in {"untracked", "added"} for item in files): risk.reasons.append("untracked or added file has limited current intelligence")
        return ChangeResponse(state="clean" if not files else "ready", repository_id=repository_id, snapshot_id=snapshot.id, git=status, diff=diff, changed_files=changed, affected_files=affected, hotspots=hotspots, tests=tests, risk=risk, truncated=len(status.files) > MAX_FILES or len(affected) >= MAX_RESULTS)

    def _empty(self, repository_id: int, state: str) -> ChangeResponse:
        return ChangeResponse(state=state, repository_id=repository_id, risk=self._risk(0, 0, 0, ChangeDiffStats(), 0, 0))

    @staticmethod
    def _risk(changed: int, direct: int, affected: int, diff: ChangeDiffStats, hotspot: float, tests: int) -> ChangeRisk:
        score = min(100, round(min(25, changed * 5) + min(20, direct * 5) + min(20, affected * 2) + min(15, (diff.additions + diff.deletions) / 100) + min(15, hotspot / 7) + (5 if not tests and changed else 0)))
        reasons = ([] if not changed else [f"{changed} changed files"])
        if affected: reasons.append(f"{affected} bounded affected files ({direct} direct)")
        if hotspot: reasons.append(f"highest touched hotspot score {hotspot:g}")
        if diff.additions + diff.deletions: reasons.append(f"{diff.additions + diff.deletions} changed lines")
        if not tests and changed: reasons.append("no associated tests found")
        return ChangeRisk(score=score, level="high" if score >= 67 else "medium" if score >= 34 else "low", reasons=reasons or ["no working-tree changes"], thresholds={"low": 33, "medium": 66, "max": 100})
