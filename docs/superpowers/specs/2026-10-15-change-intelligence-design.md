# Change Intelligence Design

## Semantics and composition

Change Intelligence is a read-only repository-level analysis of the current
working tree. `GitService` is the sole Git boundary and supplies one bounded
status/diff snapshot. The service distinguishes staged, unstaged, untracked,
added, deleted, renamed, and copied records, retaining old paths where Git
provides them. Untracked files are never treated as ordinary modified files.

The new `ChangeIntelligenceService` resolves changed paths against the latest
READY snapshot, then composes the existing reverse-dependency impact service,
hotspot query semantics, and test-relationship service. It does not reparse
source or implement alternate traversal/scoring algorithms. Deleted files are
reported as changed Git records; static impact is returned only where the READY
snapshot still contains the file. Renames use the new path for current
intelligence and preserve the old path in change metadata.

## Diff, bounds, and snapshot

Git supplies machine-readable status and bounded numstat/diff statistics. The
API returns one coherent response containing Git state, diff totals, changed
file analysis, affected files, touched hotspots, related tests, risk summary,
reasons, `snapshot_id`, and truncation metadata. Impact uses the existing
bounded default depth and deterministic path ordering; result limits prevent
unbounded response growth.

## Deterministic risk

Risk is a bounded explainable score derived only from static signals: hotspot
score, direct fan-in, transitive affected count, diff size, deletion, unresolved
dependency evidence, and associated-test evidence. Tests lower uncertainty only
when direct or heuristic associations exist; no tests is an explicit reason.
Thresholds and every reason are returned, so equal Git/snapshot state produces
equal output. Wording describes affected scope, never predicted breakage.

## API and UI

`GET /api/v1/repositories/{repository_id}/changes` returns the complete
analysis. It validates the registered root, requires a READY snapshot, and
maps non-Git/ Git failures to safe typed states without returning stderr or diff
contents. The frontend adds a Change Intelligence page to the existing
workspace navigation. It shows current-change totals, risk, changed files,
affected files, hotspots, tests, loading/clean/no-READY/non-Git/error/
truncation states, and navigates to existing file/hotspot/test surfaces.

## Security and future reuse

No hooks, code execution, raw diff content, secrets, or Git actions are exposed.
Git subprocesses remain argument-array based, bounded, timed, root-validated,
and credential-safe. The domain service is independent of the route and UI so
future CLI, history, and Git action milestones can reuse it without duplicating
analysis.

## Tests

Temporary Git repositories cover clean, staged/unstaged/mixed/untracked,
added/deleted/renamed, shared/transitive/cyclic impact, hotspot/test evidence,
risk determinism, missing READY state, boundaries, Git failures, unusual names,
and deterministic ordering without network access.
