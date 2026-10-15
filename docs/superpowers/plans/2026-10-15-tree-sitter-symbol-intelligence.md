# Tree-sitter Symbol Intelligence Implementation Plan

> **For agentic workers:** Use TDD task-by-task. Do not implement Phase 3B/3C/3D functionality.

**Goal:** Add syntax-only Tree-sitter parsing and deterministic snapshot-scoped symbol intelligence.

**Architecture:** Scanner metadata remains the source file gate. A parser registry handles supported grammars; a symbol extractor emits rows into the active snapshot; APIs expose only READY snapshot symbols.

## Tasks

### 1. Dependencies and configuration

Files: `backend/pyproject.toml`, `backend/uv.lock`, `backend/app/config.py`.

- [ ] Add pinned Tree-sitter runtime and Python, JavaScript, TypeScript, TSX, and Java grammar packages.
- [ ] Add configurable maximum parse bytes.
- [ ] Write a dependency/import smoke test first, confirm failure, then lock and install.
- [ ] Verify `uv lock`, `uv sync --dev`, and a grammar import test.

### 2. Parser registry and parse result

Files: `backend/app/services/parser/registry.py`, `result.py`, `__init__.py`,
`backend/tests/test_parser_registry.py`.

- [ ] Define `ParserRegistry`, `ParseResult`, and warning value objects.
- [ ] Register the five supported languages without scattered conditionals.
- [ ] Return unsupported-language results without raising.
- [ ] TDD supported/unsupported registry and malformed-source warning tests.

### 3. Syntax-tree service

Files: `backend/app/services/parser/service.py`, `backend/tests/test_parser_service.py`.

- [ ] Implement `parse_source(language, source, path)` with bounded UTF-8 input.
- [ ] Preserve root/tree error state and source ranges.
- [ ] TDD valid, malformed, empty, binary/oversized skip behavior.
- [ ] Run targeted parser tests and all existing scanner tests.

### 4. Symbol persistence model

Files: `backend/app/db/models.py`, `backend/tests/test_symbols.py`.

- [ ] Add `Symbol` with snapshot/file/parent relationships, kind/name/qualified name, locations, signature, warning, timestamp.
- [ ] Add indexes and duplicate unique constraint from the design.
- [ ] TDD persistence, hierarchy, snapshot isolation, and duplicate rejection.

### 5. Symbol schemas and extractor

Files: `backend/app/schemas/symbols.py`, `backend/app/services/parser/extractor.py`, `backend/tests/test_symbol_extraction.py`.

- [ ] Define `extract_symbols(tree, language, file_id, snapshot_id)`.
- [ ] Use language-specific node-query definitions held in registry entries.
- [ ] Extract modules/namespaces/classes/functions/methods/interfaces/types/enums/constructors where grammar exposes them.
- [ ] Build parent stacks, qualified names, locations, and bounded signatures.
- [ ] TDD Python and JS/TS fixtures before implementation, then Java/TSX.

### 6. Scan integration and warnings

Files: `backend/app/services/scans.py`, `backend/app/schemas/scans.py`,
`backend/tests/test_scans.py`.

- [ ] Parse each READY-eligible text file after metadata persistence.
- [ ] Persist symbols only under the new snapshot; collect parse warnings.
- [ ] Keep malformed/unsupported files non-fatal and preserve previous READY on infrastructure failure.
- [ ] TDD ready symbol counts, warnings, snapshot isolation, binary/oversized skip, and failed scan preservation.

### 7. Symbol APIs

Files: `backend/app/api/v1/symbols.py`, `backend/app/main.py`,
`backend/tests/test_symbol_api.py`.

- [ ] Implement repository symbol list with snapshot/file/kind/name/limit/cursor filters.
- [ ] Implement file symbol list and symbol detail.
- [ ] Resolve omitted snapshot to latest READY; reject wrong repository or non-ready snapshot.
- [ ] TDD pagination, filtering, 404s, and hierarchy response shape.

### 8. Fixtures, documentation, and review

Files: `backend/tests/fixtures/symbols/*`, `README.md`, `docs/api-design.md`,
design/plan documents as needed.

- [ ] Add deterministic fixtures for every supported language and failure case.
- [ ] Document actual parser languages, symbol routes, warnings, and limits.
- [ ] Review for no imports/dependencies/search/graph/impact/AI functionality.
- [ ] Run compileall, full pytest, frontend npm ci/typecheck/build, diff check.
- [ ] Docker only if available; otherwise report exact limitation.

## TDD and commit

Each task follows failing test → expected failure → smallest implementation →
targeted test → broader suite. Final commit:

```text
feat: add tree-sitter symbol intelligence
```
