# Repository Scanner & File Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a safe, deterministic repository scanner that creates complete SQLite-backed analysis snapshots containing file metadata and exposes them through the REST API and existing Files UI.

**Architecture:** Registered repositories are scanned into immutable-ish snapshots. Filesystem discovery, ignore handling, classification, language detection, and metadata extraction occur before a snapshot becomes READY. REST APIs expose only completed snapshots to consumers, while the existing Signal Map frontend progressively replaces mock file data with real scan data.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.x, SQLite, Pydantic v2, pytest, React + TypeScript + Vite.

**Spec:** The approved Phase 2B Repository Scanner & File Intelligence specification.

## Scope and global constraints

- Repository paths stored in database records must be repository-relative for discovered files.
- Only READY snapshots are valid analysis/UI snapshots.
- A failed new scan must never destroy the previous READY snapshot.
- REST polling is used for scan progress; do not introduce WebSockets or SSE.
- Do not follow symlinks outside the registered repository root.
- Always exclude `.git/`.
- Respect repository `.gitignore`.
- Default exclusions include `node_modules/`, `__pycache__/`, `.venv/`, `venv/`, `env/`, `dist/`, `build/`, `coverage/`, `.cache/`, `.pytest_cache/`, `.mypy_cache/`, `.turbo/`, and `.next/`.
- Binary files must not be decoded as source.
- Oversized files must not crash the scan.
- Individual problematic files should not fail an otherwise valid scan.
- Do not introduce Tree-sitter in this phase.
- Do not implement symbols in this phase.
- Do not implement imports/dependencies in this phase.
- Do not implement FTS5/search in this phase.
- Do not implement dependency graphs in this phase.
- Do not implement impact analysis in this phase.
- Do not implement hotspot analysis in this phase.
- Do not implement test relationship analysis in this phase.
- Do not introduce AI functionality.
- Do not redesign the existing Signal Map frontend.
- Do not hardcode repository statistics into the production UI.

### Review focus and mandatory evidence

Each item must have a focused test and appear in the implementation review:

1. Symlinks escaping the repository root must never be followed.
2. A failed scan must preserve the previous READY snapshot.
3. `.gitignore` and mandatory exclusions must be applied consistently.
4. Large/binary/problematic files must not crash an otherwise valid scan.
5. Concurrent or repeated scan requests must not expose partial snapshots as READY.

## Existing code and planned file map

The current backend uses `backend/app/main.py`, `config.py`, SQLAlchemy setup
in `backend/app/db/`, Pydantic schemas in `backend/app/schemas/`, versioned
routers in `backend/app/api/v1/`, and pytest under `backend/tests/`. The current
frontend keeps its Signal Map presentation in `frontend/src/App.tsx` and its
centralized client in `frontend/src/lib/api/client.ts`. Preserve these seams.

### Files to create

```text
backend/app/api/v1/scans.py
backend/app/api/v1/files.py
backend/app/schemas/scans.py
backend/app/schemas/files.py
backend/app/services/scans.py
backend/app/services/scanner/__init__.py
backend/app/services/scanner/scanner.py
backend/app/services/scanner/ignore.py
backend/app/services/scanner/classifier.py
backend/app/services/scanner/language.py
backend/app/services/scanner/metadata.py
backend/tests/fixtures/repositories/<deterministic fixture files>
backend/tests/test_scans.py
backend/tests/test_scanner.py
backend/tests/test_ignore_rules.py
backend/tests/test_file_metadata.py
backend/tests/test_file_tree.py
frontend/src/lib/api/scans.ts
frontend/src/lib/api/files.ts
```

### Files to modify

```text
backend/app/db/models.py
backend/app/db/database.py                  # only if session/schema support requires it
backend/app/api/v1/__init__.py              # only if router exports are used
backend/app/main.py                          # register routers only
backend/app/schemas/common.py               # only for shared pagination/error types
backend/tests/test_health.py                # only if shared test fixtures move
frontend/src/lib/api/client.ts              # preserve existing health/repository methods
frontend/src/App.tsx                         # Files route integration only; preserve visual markup/styles
frontend/src/vite-env.d.ts                  # only if new env typing is needed
README.md
docs/api-design.md
```

No application source file should be modified outside this map. Do not add
Tree-sitter, symbol, dependency, search, graph, impact, hotspot, or test-
relationship modules in this phase.

## Data and state contract

### Database models

Extend `backend/app/db/models.py` with three models. Use SQLAlchemy 2.x typed
`Mapped[...]` fields and relationships. All discovered file paths are relative
to the registered root and use POSIX `/` separators.

#### `Repository`

Keep the existing fields and add the snapshot relationship:

- `id: int`, primary key.
- `name: str`, required, max 255.
- `path: str`, registered root reference, required, max 2048, unique/indexed.
- `branch: str`, required, default `main`, max 255.
- `created_at`, `updated_at`, timezone-aware server timestamps.
- `snapshots: relationship[list[ScanSnapshot]]`, cascade delete-orphan.

The registered root reference is the only absolute path allowed in this model;
`RepositoryFile.relative_path` must never contain an absolute path.

#### `ScanSnapshot`

- `id: int`, primary key.
- `repository_id: int`, foreign key to `repositories.id`, indexed, required.
- `status: str`, indexed, required; values exactly `queued`, `scanning`,
  `finalizing`, `ready`, `failed`.
- `started_at: datetime | None`.
- `finished_at: datetime | None`.
- `processed_files: int`, default 0, non-negative.
- `discovered_files: int`, default 0, non-negative.
- `file_count: int`, default 0, non-negative.
- `total_bytes: int`, default 0, non-negative.
- `total_lines: int`, default 0, non-negative.
- `warning_count: int`, default 0, non-negative.
- `warnings_json: str`, default `[]`, serialized warning list.
- `error_message: str | None`, sanitized failure summary only.
- `repository: relationship[Repository]` and
  `files: relationship[list[RepositoryFile]]`, cascade delete-orphan.

Add indexes on `(repository_id, status)`, `(repository_id, created_at)`, and
`(repository_id, status, id)` to make latest/active snapshot queries explicit.

#### `RepositoryFile`

- `id: int`, primary key.
- `snapshot_id: int`, foreign key to `scan_snapshots.id`, indexed, required.
- `relative_path: str`, required, max 2048, indexed.
- `name: str`, required, max 255, indexed.
- `extension: str`, required, default empty string.
- `language: str`, required, default `Unknown`, indexed.
- `classification: str`, required; exactly `TEXT`, `BINARY`, or `SKIPPED`.
- `size_bytes: int`, required, non-negative.
- `line_count: int | None`, null for binary/skipped files.
- `is_binary: bool`, required, default false.
- `is_test: bool`, required, default false, indexed.
- `warning: str | None`, per-file recoverable issue.
- `snapshot: relationship[ScanSnapshot]`.

Add a unique constraint on `(snapshot_id, relative_path)` and indexes on
`(snapshot_id, name)`, `(snapshot_id, language)`, `(snapshot_id, is_test)`, and
`(snapshot_id, relative_path)`. Do not add source-content storage in this phase.

### Status transition rules

Valid lifecycle: `queued → scanning → finalizing → ready`; any non-ready active
snapshot may transition to `failed`. `ready` and `failed` are terminal. A new
snapshot is never the repository's current READY snapshot until finalization
commits successfully. Existing READY data remains queryable during a new scan.

## Exact service interfaces

Use the project's existing Python typing style. Interfaces below are the
contract; implementations may use private helpers but must not widen scope.

```python
# backend/app/services/scanner/scanner.py
from collections.abc import Callable, Iterator
from pathlib import Path

ProgressCallback = Callable[["ScanProgress"], None]

def scan_repository(
    root: Path,
    policy: "IgnorePolicy",
    limits: "ScanLimits",
    on_progress: ProgressCallback | None = None,
) -> "ScanResult": ...

def discover_files(
    root: Path,
    policy: "IgnorePolicy",
    limits: "ScanLimits",
) -> Iterator["DiscoveredFile"]: ...
```

```python
# backend/app/services/scanner/ignore.py
class IgnorePolicy:
    def should_exclude_dir(self, relative_path: str) -> bool: ...
    def should_exclude_file(self, relative_path: str) -> bool: ...

def build_ignore_policy(root: Path) -> IgnorePolicy: ...
```

```python
# backend/app/services/scanner/classifier.py
def classify_file(path: Path, max_file_bytes: int) -> "FileClassification": ...
```

```python
# backend/app/services/scanner/language.py
def detect_language(name: str) -> str: ...
```

```python
# backend/app/services/scanner/metadata.py
def extract_metadata(
    root: Path,
    path: Path,
    classification: "FileClassification",
) -> "FileMetadata": ...
```

```python
# backend/app/services/scans.py
def create_scan_snapshot(db: Session, repository_id: int) -> ScanSnapshot: ...
def run_scan(db: Session, snapshot_id: int, limits: ScanLimits | None = None) -> ScanSnapshot: ...
def finalize_scan(db: Session, snapshot_id: int) -> ScanSnapshot: ...
def fail_scan(db: Session, snapshot_id: int, message: str) -> ScanSnapshot: ...
```

`run_scan` is synchronous in this phase and is called through a deliberately
bounded service seam. The API may invoke it through a thread-backed mechanism
later, but no worker system, queue, WebSocket, or SSE is introduced now. If the
HTTP request waits for completion in the first implementation, the API must
still create the snapshot before work starts and expose its transitions through
the polling endpoints. If the implementation uses a lightweight in-process
background task, it must make the active-scan conflict and shutdown behavior
explicit and testable.

Supporting typed value objects should live with their narrow service:

- `ScanLimits(max_file_bytes, max_files, max_scan_seconds)`.
- `FileClassification(kind, is_binary, reason)`.
- `DiscoveredFile(path, relative_path, stat)`.
- `FileMetadata(relative_path, name, extension, language, size_bytes, line_count, is_binary, is_test, warning)`.
- `ScanProgress(status, processed_files, discovered_files, percentage, statistics, warnings)`.
- `ScanResult(files, statistics, warnings)`.

## Implementation tasks

Each task is TDD-first. For every checkbox: write the smallest failing test,
run that targeted test and record the failure, implement the minimum behavior,
run the targeted test, then run the relevant broader suite. Commit boundaries
are optional during implementation; do not create the final feature commit
until all tasks pass. The final requested implementation commit is exactly:
`feat: add repository scanner and file intelligence`.

### TASK 1 — Database models and snapshot state

**Files:** `backend/app/db/models.py`, `backend/app/db/database.py`,
`backend/tests/test_scans.py`.

- [ ] Add `ScanSnapshot` and `RepositoryFile`; add `Repository.snapshots`.
- [ ] Add exact fields, constraints, indexes, cascade rules, and status values
      described above.
- [ ] Keep SQLite initialization deterministic through the existing `init_db`
      seam; do not introduce migration tooling in this phase.
- [ ] Define a test fixture that creates a temporary SQLite database and tables.
- [ ] TDD: fail first on model import/relationship persistence, then implement.
- [ ] Test repository → snapshots → files relationships, unique relative path,
      status defaults, counters, and cascade cleanup.
- [ ] Verify with `cd backend && uv run pytest tests/test_scans.py`.

### TASK 2 — Safe repository-root handling

**Files:** `backend/app/services/scanner/scanner.py` or a focused
`backend/app/services/scanner/paths.py` only if needed, and
`backend/tests/test_scanner.py`.

- [ ] Implement registered-root validation: exists, is a directory, readable,
      and resolved once with `Path.resolve(strict=True)`.
- [ ] Implement safe relative conversion using resolved paths and reject
      traversal/absolute results.
- [ ] Do not follow symlinks during directory discovery unless the resolved
      target remains inside the registered root; reject escaping links.
- [ ] TDD tests: valid root, missing root, file root, `../` traversal,
      in-root symlink, escaping symlink, and unreadable path where the platform
      permits a deterministic fixture.
- [ ] Verify with `cd backend && uv run pytest tests/test_scanner.py -k 'root or symlink or traversal'`.

### TASK 3 — Ignore rules

**Files:** `backend/app/services/scanner/ignore.py`,
`backend/tests/test_ignore_rules.py`.

- [ ] Define mandatory exclusions with `.git/` always excluded.
- [ ] Define default generated/build/cache directory exclusions exactly as
      listed in the global constraints.
- [ ] Load and apply repository `.gitignore` patterns relative to the root.
- [ ] Keep policy decisions independent of filesystem traversal so they can be
      tested with relative paths only.
- [ ] Define directory pruning semantics: an excluded directory is skipped
      before descent; an excluded file is never yielded.
- [ ] TDD tests cover mandatory exclusions, every default category, root and
      nested `.gitignore` patterns, negation behavior supported by the chosen
      parser, and consistent dir/file decisions.
- [ ] Verify with `cd backend && uv run pytest tests/test_ignore_rules.py`.

### TASK 4 — File discovery

**Files:** `backend/app/services/scanner/scanner.py`,
`backend/tests/test_scanner.py`, and fixture repository files.

- [ ] Implement recursive traversal that yields `DiscoveredFile` records with
      repository-relative POSIX paths.
- [ ] Prune excluded directories before descending; skip unsafe symlinks and
      never read outside the root.
- [ ] Use directory entry/stat metadata first; do not load file contents during
      discovery.
- [ ] Catch per-entry permission/stat errors, append warnings, and continue.
- [ ] Enforce max file count and scan-time limits with a deterministic warning
      and terminal scan outcome defined by the orchestrator.
- [ ] TDD tests cover nested directories, excluded trees, symlink behavior,
      relative paths, file errors, and stable ordering.
- [ ] Verify with `cd backend && uv run pytest tests/test_scanner.py`.

### TASK 5 — File classification

**Files:** `backend/app/services/scanner/classifier.py`,
`backend/tests/test_file_metadata.py`.

- [ ] Implement `TEXT`, `BINARY`, and `SKIPPED` classification.
- [ ] Check size before reading; classify oversized files as `SKIPPED` with a
      warning rather than decoding them.
- [ ] Detect binary content with a bounded byte probe; empty files are TEXT.
- [ ] Do not decode binary data as source and do not retain full file contents.
- [ ] TDD tests: normal source, Markdown, binary bytes, oversized file, empty
      file, unknown extension, and a read failure.
- [ ] Verify with `cd backend && uv run pytest tests/test_file_metadata.py -k classification`.

### TASK 6 — Language detection

**Files:** `backend/app/services/scanner/language.py`,
`backend/tests/test_file_metadata.py`.

- [ ] Implement deterministic filename/extension mappings only; no content,
      AST, Tree-sitter, or framework inference.
- [ ] Cover TypeScript, TSX, JavaScript, JSX, Python, Java, C, C++, C#, Go,
      Rust, PHP, HTML, CSS, SCSS, JSON, YAML, Markdown, Shell, Dockerfile,
      and `Unknown`.
- [ ] Define filename matching for `Dockerfile` and common shell filenames.
- [ ] TDD tests verify case normalization, multi-part extensions, special names,
      and unknown files.
- [ ] Verify with `cd backend && uv run pytest tests/test_file_metadata.py -k language`.

### TASK 7 — File metadata extraction

**Files:** `backend/app/services/scanner/metadata.py`,
`backend/tests/test_file_metadata.py`.

- [ ] Implement `extract_metadata` for relative path, name, extension,
      language, byte size, line count, binary flag, test flag, and warning.
- [ ] Count lines using a streaming/bounded read and handle LF, CRLF, and CR.
- [ ] Set `line_count=None` for BINARY and SKIPPED files.
- [ ] Define the deterministic test heuristic: a file is a test when its
      repository-relative path contains a directory segment named `test` or
      `tests`, or its filename stem ends with `.test`, `.spec`, `_test`, or
      `Test`; matching is case-insensitive. This is metadata classification only,
      not test relationship analysis.
- [ ] TDD tests cover every metadata field, newline styles, binary/skipped
      behavior, test/non-test paths, dotfiles, and extensionless files.
- [ ] Verify with `cd backend && uv run pytest tests/test_file_metadata.py`.

### TASK 8 — Scan orchestration

**Files:** `backend/app/services/scans.py`, `backend/app/db/models.py`,
`backend/tests/test_scans.py`.

- [ ] Implement lifecycle in order: create snapshot, `QUEUED`; validate root;
      `SCANNING`; discover/classify/metadata/persist; `FINALIZING`; calculate
      file-only statistics; commit; then `READY`.
- [ ] On unrecoverable root/database/orchestrator failure, mark only the new
      snapshot `FAILED` with a sanitized error and preserve the prior READY
      snapshot and its files.
- [ ] Treat individual file warnings as recoverable and include them in the
      snapshot warning list.
- [ ] Ensure new snapshot rows are not visible through READY queries until the
      final transaction commits.
- [ ] Prevent duplicate active scans for one repository with a transaction-safe
      conflict check and `409` API behavior.
- [ ] TDD tests explicitly verify success, failure, previous READY preservation,
      counters, warning persistence, and repeated/concurrent scan behavior.
- [ ] Verify with `cd backend && uv run pytest tests/test_scans.py`.

### TASK 9 — Scan progress

**Files:** `backend/app/schemas/scans.py`, `backend/app/services/scans.py`,
`backend/tests/test_scans.py`.

- [ ] Define response fields: `status`, `processed_files`, `discovered_files`,
      `percentage`, `statistics`, `warnings`, `snapshot_id`, and timestamps.
- [ ] Update progress after discovery and each processed file without exposing
      file rows as a READY snapshot.
- [ ] Define percentage for zero-file, unknown-total, scanning, finalizing,
      ready, and failed states.
- [ ] Keep statistics partial and explicitly labeled until READY; never imply
      partial analysis is complete.
- [ ] TDD tests verify monotonic progress, lifecycle transitions, warning
      visibility, zero-file handling, and terminal progress.
- [ ] Verify with `cd backend && uv run pytest tests/test_scans.py -k progress`.

### TASK 10 — Scan API

**Files:** `backend/app/api/v1/scans.py`, `backend/app/api/v1/__init__.py`,
`backend/app/main.py`, `backend/app/schemas/scans.py`,
`backend/tests/test_scans.py`.

Implement exact routes:

```text
POST /api/v1/repositories/{repository_id}/scans
GET  /api/v1/repositories/{repository_id}/scans
GET  /api/v1/repositories/{repository_id}/scans/latest
GET  /api/v1/repositories/{repository_id}/scans/{scan_id}
```

Request shape:

```json
{"force": false}
```

Response shape:

```json
{
  "id": 12,
  "repository_id": 1,
  "status": "ready",
  "started_at": "2026-10-15T10:00:00Z",
  "finished_at": "2026-10-15T10:00:01Z",
  "processed_files": 42,
  "discovered_files": 42,
  "percentage": 100,
  "statistics": {"file_count": 42, "total_bytes": 12345, "total_lines": 900},
  "warnings": []
}
```

- [ ] `POST` returns `202` with a queued/scanning snapshot or `409` for an
      active scan; it never returns a partial READY result.
- [ ] `GET` list supports `status`, `limit`, and `cursor`; default ordering is
      newest first.
- [ ] `latest` returns the latest READY snapshot, or a clear `404`/empty shape
      when none exists, without substituting a failed snapshot.
- [ ] Detail returns any lifecycle status for that repository and exact scan.
- [ ] Test successful scan, unknown repository, status polling, latest READY,
      failed scan, previous READY preservation, validation, and conflict.
- [ ] Verify with `cd backend && uv run pytest tests/test_scans.py`.

### TASK 11 — Files API

**Files:** `backend/app/api/v1/files.py`, `backend/app/schemas/files.py`,
`backend/app/main.py`, `backend/tests/test_file_tree.py`.

Implement only READY-snapshot reads:

```text
GET /api/v1/repositories/{repository_id}/files
GET /api/v1/repositories/{repository_id}/files/{file_id}
GET /api/v1/repositories/{repository_id}/files/tree
```

Query contracts:

- `files`: `snapshot_id: int | None`, `path_prefix: str | None`,
  `language: str | None`, `is_test: bool | None`, `limit: int = 100`,
  `cursor: str | None`, `sort: path|size|name`.
- `file/{file_id}`: `snapshot_id: int | None`; reject a file from a different
  repository/snapshot with `404`.
- `tree`: `snapshot_id: int | None`, `parent_path: str = ""`,
  `depth: int = 1`, `include_files: bool = true`.

Response contracts:

- List: `{snapshot_id, items, next_cursor, has_more}`.
- Detail: `{snapshot_id, file}` with all metadata fields and warning.
- Tree: `{snapshot_id, path, items}` where each item has `name`, `path`,
  `kind: directory|file`, `language`, `size_bytes`, and `child_count` when
  known.

- [ ] Resolve omitted `snapshot_id` to latest READY only.
- [ ] Return `409`/`404` when a requested snapshot is not READY or absent.
- [ ] Normalize and reject unsafe `path_prefix`/`parent_path` traversal.
- [ ] Implement stable cursor pagination and filters against indexed metadata.
- [ ] Make tree navigation server-side; never require the frontend to load the
      entire repository.
- [ ] TDD tests cover pagination, language/test/path filters, tree navigation,
      unknown file, unknown repository, wrong snapshot, and failed snapshot.
- [ ] Verify with `cd backend && uv run pytest tests/test_file_tree.py`.

### TASK 12 — Frontend API integration

**Files:** `frontend/src/lib/api/client.ts`,
`frontend/src/lib/api/scans.ts`, `frontend/src/lib/api/files.ts`.

- [ ] Preserve the single request/error handling seam in `client.ts`.
- [ ] Add typed methods for starting scans, listing scans, scan status/latest,
      file listing, file detail, and tree nodes.
- [ ] Match backend JSON naming consistently; if the backend uses snake_case,
      define explicit frontend DTOs and a single mapping seam rather than
      scattering conversions through components.
- [ ] Reuse existing `VITE_API_BASE_URL` and Vite `/api` proxy behavior.
- [ ] Do not add a state-management library or move unrelated mock screens.
- [ ] Verify with `cd frontend && npm run typecheck && npm run build`.

### TASK 13 — Files UI integration

**Files:** `frontend/src/App.tsx` and only supporting API/state files if the
existing component needs extraction.

- [ ] Replace only the Files screen's mock repository/file list and tree data
      with real API state.
- [ ] Preserve Signal Map colors, typography, sidebar, table, tree, spacing,
      layout, and visual hierarchy from the approved design.
- [ ] Implement explicit states: no repository, unscanned, scanning, ready,
      failed, previous READY while a new scan runs, empty repository, API error.
- [ ] Keep the other mock screens unchanged and do not hardcode production
      repository statistics into their future integration boundary.
- [ ] Show scan freshness/status through existing shell language or a minimal
      inline state; do not add a dashboard redesign or debug banner.
- [ ] Verify manually at 1440px+, 1280px, and 1024px widths; verify file/tree
      keyboard navigation remains intact.

### TASK 14 — Scan controls and polling

**Files:** `frontend/src/lib/api/scans.ts`, `frontend/src/App.tsx`, and a
focused hook file such as `frontend/src/hooks/useScanPolling.ts` only if
needed.

- [ ] Connect repository registration, scan start, status polling, and file
      refresh through the centralized client.
- [ ] Poll with a bounded interval and stop on `ready` or `failed`.
- [ ] Clean up timers and ignore stale responses on unmount or repository
      change; never update state after disposal.
- [ ] Preserve previous READY file data while a new scan is active.
- [ ] Disable duplicate scan actions while an active scan exists and surface
      conflict/error states using existing visual language.
- [ ] Verify with focused hook/component tests if a frontend test harness is
      already introduced; otherwise use a deterministic browser smoke check and
      `npm run typecheck`/build without adding a large test framework solely for
      this task.

### TASK 15 — Integration tests

**Files:** `backend/tests/test_scans.py`, `backend/tests/test_file_tree.py`,
`backend/tests/fixtures/repositories/`, and a frontend/browser test only if the
existing toolchain supports it without a new framework.

- [ ] Create a deterministic fixture repository with nested source files,
      ignored/default-excluded directories, `.gitignore`, binary, empty,
      oversized, unreadable/problematic, and symlink cases where supported.
- [ ] Test: register repository → start scan → fixture scan → READY → list
      files → tree query → detail query.
- [ ] Test: READY snapshot → new scan → forced failure → failed new snapshot,
      previous READY remains latest valid snapshot and files remain queryable.
- [ ] Test repeated/concurrent scan requests and assert no partial snapshot is
      returned as READY.
- [ ] Verify with `cd backend && uv run pytest` and the existing frontend checks.

### TASK 16 — Docker and clean-machine verification

**Files:** `Dockerfile`, `.dockerignore`, `README.md`, and only runtime files
required by an observed container failure.

- [ ] Preserve the existing multi-stage frontend build and Python 3.12 runtime.
- [ ] Confirm backend startup, SQLite initialization, static frontend serving,
      and health check in a Docker-enabled environment.
- [ ] Confirm a mounted repository can be registered and scanned without
      developer-machine absolute paths.
- [ ] Confirm `GET /api/v1/health`, repository registration, scan, and files
      work inside the container.
- [ ] Do not claim Docker verification while Docker is unavailable here.
      Required later command set:

      ```bash
      docker build -t repopilot .
      docker run --rm -p 3000:3000 repopilot
      curl -fsS http://127.0.0.1:3000/api/v1/health
      ```

- [ ] If Docker remains unavailable, record the exact limitation in the final
      implementation report, not as a passing check.

### TASK 17 — Documentation

**Files:** `README.md`, `docs/api-design.md`.

- [ ] Document actual scan and file routes, request/response shapes, polling,
      READY snapshot semantics, pagination, and failure preservation.
- [ ] Document actual local setup/test/build commands and any Docker limitation.
- [ ] State that Tree-sitter, symbols, imports/dependencies, FTS5 search,
      graphs, impact, hotspots, and test relationship analysis remain future
      phases unless implemented by a later approved task.
- [ ] Do not describe future functionality as currently available.
- [ ] Validate Markdown and inspect `git diff --check`.

## Cross-task test matrix

| Review focus | Primary tests |
|---|---|
| Symlink escape never followed | `test_scanner.py` root/symlink cases; integration fixture scan |
| Failed scan preserves READY | `test_scans.py` failure/preservation; API latest/files tests |
| `.gitignore` and mandatory exclusions | `test_ignore_rules.py`; fixture integration scan |
| Large/binary/problematic files | classifier and metadata tests; scan warning integration |
| No partial READY under concurrency/repetition | orchestration conflict tests; scan API repeated request tests |

## Plan-level verification checklist

Before implementation is considered complete, the implementing agent must be
able to check every item:

- [ ] Every task has explicit files, interfaces, tests, and commands.
- [ ] Database fields, relationships, constraints, indexes, and status values
      are implemented exactly as specified.
- [ ] Every scan and files API route has a defined request/query/response shape.
- [ ] Only READY snapshots are exposed to file/UI consumers.
- [ ] Failed scans preserve previous READY snapshots.
- [ ] No task adds Tree-sitter, symbols, dependencies, search, graph, impact,
      hotspots, test relationships, or AI functionality.
- [ ] Signal Map frontend visuals remain intact.
- [ ] `git diff --check`, backend tests, frontend typecheck/build, and any
      available Docker checks pass.
- [ ] Final feature commit is `feat: add repository scanner and file intelligence`.

## Approval gate

This document is planning-only. Do not install dependencies, modify application
source, create migrations, create scanner code, or start implementation until
the plan receives explicit approval.
