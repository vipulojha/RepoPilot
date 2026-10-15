# Milestone 5C — Change Intelligence Implementation Plan

## Dependencies and sequence

Steps are ordered; each gate must pass before the next begins.

### 1. Freeze the contract and fixture

- Confirm the existing `GitStatusResponse`, `RepositoryFile`, impact, hotspot,
  and test DTOs against the design.
- Add a deterministic temporary Git fixture helper under
  `backend/tests/test_changes.py` using existing `tmp_path`/SQLite override
  conventions.
- Fixture commits an analyzed source, dependent module, test file, added file,
  and configuration-like file, then creates staged/unstaged/rename/delete/
  untracked scenarios without network access.
- Tests: fixture creates expected Git porcelain states and a READY snapshot.

### 2. Extend the Git boundary for current changes

- Likely file: `backend/app/services/git.py`.
- Add a reusable method for bounded current status plus diff statistics; keep
  argv arrays, root validation, timeout, output cap, and no stderr exposure in
  the existing service.
- Reuse existing porcelain parsing and preserve index/worktree/rename/copy
  semantics. Do not add a second subprocess helper.
- Tests: service-level staged/unstaged/mixed/untracked/added/deleted/renamed/
  copied, clean, detached, empty, special filename, timeout, and non-Git cases.

### 3. Define the composed domain response

- Likely files:
  - `backend/app/services/changes.py`
  - `backend/app/schemas/changes.py`
- Refine `ChangeIntelligenceService` to consume the new Git boundary, map
  normalized current paths to the latest READY snapshot, and compose existing
  `analyze_impact`, `calculate_hotspots`, and `relationships` results.
- Add explicit current/historical labels, deletion/unmapped semantics,
  configurable bounded depth/limit, and deterministic ordering.
- Implement the documented risk formula and reasons from supported signals only.
- Tests: symbol/path mapping, reverse-impact direction, cycles, hotspot filter,
  direct versus heuristic tests, no tests, high/low deterministic risk,
  no-READY, and truncation.

### 4. Stabilize the API contract

- Likely files:
  - `backend/app/api/v1/changes.py`
  - `backend/app/main.py`
  - `backend/tests/test_changes.py`
- Preserve `GET /api/v1/repositories/{repository_id}/changes` and add only
  bounded query parameters that fit existing conventions.
- Validate repository ownership/path through the existing lookup and service.
- Tests: 404 repository, clean response, no READY response, non-Git/Git error,
  query bounds, coherent snapshot ID, and no raw stderr/diff leakage.

### 5. Frontend contract integration

- Likely files:
  - `frontend/src/lib/api/client.ts`
  - `frontend/src/App.tsx`
  - `frontend/src/styles.css` only if contract states need a small fix
- Reconcile DTOs with the final nested API response. Keep the current Change
  Intelligence navigation and reuse File Hub, Hotspots, Tests, and Impact.
- Verify loading, clean, no READY, non-Git, detached, error, truncation,
  keyboard focus, and responsive behavior. No mock data.
- Validation: `npm ci`, `npm run typecheck`, `npm run build`.

### 6. Security and regression review

- Review changed Git/service/API code for shell execution, path escape,
  unbounded output, timeout gaps, hooks, mutation, raw stderr, secrets, and
  malicious filenames.
- Run backend compile and full pytest; ensure test count increases and new
  tests assert behavior rather than status codes.
- Run `git diff --check` and inspect `git diff --stat`.

### 7. Docker acceptance smoke test

- Build from `/home/RepoPilot` with `docker build -t repopilot:local .`.
- Run a disposable non-root container with a temporary fixture mounted read-only
  and a temporary `/app/data` volume.
- Register, scan, call Change Intelligence for clean and controlled changed
  states, verify health/frontend/API/current snapshot context, then remove the
  container, volume, and fixture.

## Exact validation commands

```bash
cd /home/RepoPilot/backend
uv run python -m compileall app
uv run pytest

cd /home/RepoPilot/frontend
npm ci
npm run typecheck
npm run build

cd /home/RepoPilot
docker build -t repopilot:local .
```

## Final acceptance criteria

- Current Git changes and statuses are faithfully represented.
- Current READY snapshot ID is explicit and stale/no-READY state is safe.
- Existing intelligence services are composed, not duplicated.
- Risk is deterministic, bounded, and explained by returned reasons.
- Backend tests cover realistic staged/unstaged/untracked and intelligence
  scenarios in disposable fixtures.
- Frontend uses the real typed response and preserves existing navigation.
- Docker build/runtime smoke tests pass as non-root.
- No out-of-scope Git actions, history reconstruction, hosting integration, or
  AI behavior is introduced.
