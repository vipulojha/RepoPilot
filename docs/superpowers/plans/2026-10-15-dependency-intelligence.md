# Dependency Intelligence Implementation Plan

> **For agentic workers:** Use TDD task-by-task. Do not implement search, graph UI, impact, hotspots, test relationships, or AI.

**Goal:** Persist deterministic internal, external, and unresolved file dependency relationships for READY snapshots.

## Tasks

1. **Model and schemas** — Add `Dependency` with snapshot/source/target,
   module name, kind, status, line/column, evidence, indexes, uniqueness, and
   typed response schemas. Test persistence and isolation.
2. **Extraction** — Add parser-tree dependency extractors for Python, JS/JSX,
   TS/TSX, and Java. Test imports, relative imports, duplicate statements,
   malformed and unsupported files.
3. **Resolution** — Build one path index per scan. Implement JS/TS extension and
   index resolution, Python module/relative resolution, and Java package mapping.
   Test internal, external, and unresolved outcomes.
4. **Scan integration** — Run extraction after symbol parsing, persist edges in
   the new snapshot, collect warnings, and preserve previous READY on failure.
5. **APIs** — Add forward, reverse, and relationship-detail routes with READY
   snapshot checks, filters, pagination, and repository/file 404 behavior.
6. **Fixtures and integration tests** — Add deterministic multi-language fixture
   files and API workflow tests for forward/reverse/snapshot behavior.
7. **Documentation and validation** — Update API/README, run compileall,
   pytest, frontend typecheck/build, diff check, and honest Docker check.

Every task follows failing test, expected failure, minimal implementation,
targeted test, broader suite. Final commit: `feat: add dependency intelligence`.
