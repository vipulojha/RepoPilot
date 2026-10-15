# Milestone 5C — Change Intelligence Design

## Problem statement

RepoPilot already knows the current Git state and has a READY-snapshot model of
files, symbols, internal dependencies, reverse impact, hotspots, and static
test relationships. The missing product connection is a single answer to:
"What do my current working-tree changes affect?" Change Intelligence will
join those two sources without claiming historical facts or predicting runtime
breakage.

## Goals

- Inspect the current working tree through the existing safe Git boundary.
- Preserve staged, unstaged, untracked, added, deleted, renamed, and copied
  semantics rather than collapsing them into one modified state.
- Map current changed paths to the latest READY `RepositoryFile` records and
  their parsed symbols/dependencies.
- Reuse existing reverse-impact, hotspot, and test-relationship algorithms.
- Return one bounded, deterministic response with explicit evidence and risk
  reasons.
- Expose the result in the existing workspace with navigation to File Hub,
  Hotspots, Tests, and Impact views.

## Non-goals

No stage/unstage/commit/push/pull/fetch/merge/rebase/reset/revert/cherry-pick/
stash, branch mutation, hosting-provider integration, historical dependency
reconstruction, full diff editor, arbitrary code execution, hooks, or LLM/AI
explanations. No new persistence layer or background worker is needed.

## Existing architecture findings

- `GitService` is the single repository-root validator and subprocess boundary.
  It uses argv arrays, `safe.directory`, a five-second timeout, bounded stdout,
  and safe errors. Its porcelain parser already distinguishes working-tree
  status, rename source paths, conflicts, and remote-safe data.
- `GitHistoryService` is a bounded consumer of `GitService`; it is not a second
  subprocess abstraction and is not needed for current changes.
- `Repository` stores the registered root. `ScanSnapshot` and
  `RepositoryFile` provide snapshot ownership and current path/file IDs.
- `analyze_impact` traverses reverse internal dependencies only, with a bounded
  depth and deterministic ordering. A → B means A depends on B, so changing B
  starts traversal from B.
- `calculate_hotspots` is the existing deterministic score based on current
  lines, symbols, fan-in, fan-out, and bounded reverse reach.
- `relationships` supplies direct-dependency and naming-convention test
  evidence from the current snapshot.
- The existing frontend already has Change Intelligence, File Hub, Impact,
  Hotspots, Tests, and History surfaces plus typed API DTOs. The design should
  harden their contract rather than introduce another workspace shell.
- Docker installs Git in the production image and serves the frontend/API from
  one non-root container.

## Proposed architecture and data flow

```text
registered Repository.path
        ↓
GitService.current_changes()
        ↓
ChangeIntelligenceService
  ├─ latest_ready(snapshot)
  ├─ RepositoryFile path mapping
  ├─ existing analyze_impact()
  ├─ existing calculate_hotspots()
  └─ existing relationships()
        ↓
GET /api/v1/repositories/{repository_id}/changes
        ↓
Change Intelligence workspace
```

`GitService` should gain a reusable current-change/diff-stat operation rather
than having Change Intelligence call `subprocess.run` directly. The operation
must collect status and bounded numstat data in a small number of Git calls.
`ChangeIntelligenceService` owns composition and risk only. It never reparses
source and never creates a second graph traversal.

## Git change semantics

The service should return one record per current Git status entry with:

- `path` and optional `old_path`
- normalized type: `added`, `modified`, `deleted`, `renamed`, `copied`, or
  `untracked`
- raw index/worktree status bytes for staged/unstaged distinction
- additions/deletions where Git can provide them
- whether the path maps to the current READY snapshot

Rules:

- Staged and unstaged changes remain distinguishable, including mixed `XY`
  states.
- Untracked files are not silently treated as modified files. They may have
  path-level metadata only; they have no current snapshot symbols until a scan.
- Deleted files retain Git metadata but do not receive fabricated current
  source/symbol data. Existing snapshot records may be used only as clearly
  labeled last-known current-snapshot context.
- Renames preserve both paths and map the new path first; the old path is
  historical Git metadata, not a current file identity.
- Clean working trees return a successful empty analysis with no fake risk or
  affected-file data.
- Non-Git, Git-unavailable, detached, and empty repositories are explicit
  states. Detached HEAD is Git context, not an error.

## Snapshot and intelligence mapping

The response always identifies `snapshot_id` when a READY snapshot exists.
Changed paths are mapped by normalized repository-relative POSIX path. Mapped
files may expose current file ID, current symbols, dependency fan-in/fan-out,
reverse impact, hotspot data, and associated tests. These are labeled current
READY-snapshot intelligence. They must never be phrased as facts about the
historical or pre-change repository state.

For mapped roots, call `analyze_impact(db, snapshot_id, root_ids, max_depth)`
using the existing documented default depth (currently 3). Only internal
dependency edges participate. Affected files are bounded and sorted by depth,
path, and ID. Tests use existing strong direct-dependency and heuristic naming
evidence. Hotspots use the existing `calculate_hotspots` output filtered to
changed/affected current file IDs.

## API contract

```text
GET /api/v1/repositories/{repository_id}/changes
```

Optional bounded query parameters:

- `max_depth`: integer, default 3, bounded to the existing impact limit
- `limit`: integer, default 100, bounded for changed/affected/test results

The typed response should contain:

- `state`: `ready`, `clean`, `no_ready_snapshot`, `not_git`, or `git_error`
- `repository_id`
- `snapshot_id` or null
- Git state relevant to the analysis
- bounded diff totals: files, additions, deletions
- changed-file records and status semantics
- affected current files with existing impact evidence/path
- touched current hotspots
- associated current tests and evidence level
- `risk`: bounded score, `low`/`medium`/`high` level, thresholds, reasons
- `truncated` plus bounded-result metadata where applicable

Repository lookup and root validation remain server-side. Missing repository is
404. No READY snapshot is a safe response state for historical Git data plus
unavailable current intelligence. Non-Git/Git failures are safe typed states
or stable 422 errors according to the existing Git API convention; raw stderr
must not escape.

## Deterministic risk model

Only signals represented in the current data model are used:

1. changed-file count, capped;
2. additions plus deletions, capped;
3. direct and bounded transitive affected-file counts from `analyze_impact`;
4. maximum current hotspot score among changed/affected files;
5. whether current internal dependents exist;
6. whether current associated tests exist and whether evidence is strong or
   heuristic;
7. deleted/unmapped/configuration-like changes as explicit categorical reasons.

The score is a stable bounded sum with documented caps and thresholds. Every
non-zero component contributes a human-readable reason such as “12 current
files in bounded reverse impact” or “no associated current tests found”. A
missing READY snapshot or unavailable Git state does not receive a fabricated
risk score; the response reports unavailable current intelligence instead.
Signals such as public API symbols, historical churn, runtime coverage, or
semantic module boundaries are excluded until the data model supports them.

## Frontend behavior

The existing Change Intelligence page becomes the repository-level entry point.
It shows current changes, additions/deletions, risk level/score, risk reasons,
changed files, affected files, hotspots, and associated tests. Each current
file ID navigates to File Intelligence Hub; affected files use the existing
Impact semantics; hotspot/test actions open existing surfaces.

Required states are: repository selection, loading, clean/no changes, no READY
snapshot, non-Git/Git unavailable, detached context, analysis error, and
truncated results. Controls remain keyboard-focusable and responsive. No mock
data or duplicate detail page is introduced.

## Security model

All Git execution remains inside `GitService`: argv arrays only, no shell,
validated registered root, `cwd` pinned to that root, bounded stdout, timeout,
safe error mapping, no hooks, no mutation, and no repository code execution.
Filenames, Unicode, refs, and status output are untrusted data. Diff content is
not returned by default and is never logged wholesale. Remote credentials are
handled by existing Git sanitization; raw stderr and secrets never enter API
responses.

## Testing strategy

Use a disposable deterministic Git fixture plus the existing temporary SQLite
fixture style. Cover clean, modified, staged, mixed, untracked, added, deleted,
renamed, copied, detached, empty, non-Git, special filenames, and no-READY
states. After scanning the fixture, assert path mapping, symbols/dependencies,
reverse impact direction, hotspot filtering, strong/heuristic test evidence,
risk reasons/ordering, truncation, and historical/current separation. Add
service tests for Git failure/timeout and API tests for safe errors. No network
or real repository paths.

## Docker validation

Build `repopilot:local`, run the non-root production container with a temporary
Git fixture mounted read-only and a disposable SQLite volume, register and
scan the fixture, create controlled staged/unstaged/untracked changes outside
the image, and verify health plus the Change Intelligence API. Confirm current
READY intelligence, clean state, risk reasons, and no startup/security errors.
Remove all disposable resources afterward.

## Limitations

5C will not reconstruct dependencies at historical commits, inspect arbitrary
patch contents, infer runtime behavior, run tests, perform Git actions, or use
AI. Untracked/deleted/unmapped paths can only receive path/Git evidence until a
new scan provides current source intelligence.

## Acceptance criteria

- One read-only endpoint returns a coherent bounded current-change analysis.
- All Git status categories remain explicit and deterministic.
- READY-snapshot mapping uses existing file/symbol/dependency/impact/hotspot/
  test services without duplicate algorithms.
- Risk is bounded, deterministic, and reasoned.
- Clean, no-READY, non-Git, detached, empty, and truncation states are explicit.
- Security constraints are preserved and tested.
- Backend fixture/API tests, frontend checks, and Docker smoke validation pass.
- No Git mutation, history reconstruction, hosting integration, or AI summary is
  added.
