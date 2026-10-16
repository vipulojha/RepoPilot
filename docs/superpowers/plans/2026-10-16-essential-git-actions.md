# Milestone 5D — Essential Git Actions Implementation Plan

## Ordered implementation steps

### 1. Action schemas and preflight primitives

- Files: `backend/app/schemas/git_actions.py`, `backend/app/services/git.py`.
- Add typed request/receipt models, path/ref/message validators, bounded output,
  per-repository serialization, and a status/HEAD refresh helper.
- Tests: invalid paths, branch names, commit IDs, messages, non-Git roots,
  special filenames, timeout/error mapping, and no shell invocation.

### 2. Safe local mutations

- Files: `backend/app/services/git.py`, `backend/app/api/v1/git_actions.py`,
  `backend/app/main.py`.
- Implement stage, unstage, commit, branch create, branch switch, and revert.
- Enforce clean-tree/preflight rules, explicit staged scope, `--no-verify`,
  conflict receipts, and stale READY-snapshot marking.
- Tests: actual index/worktree/commit/branch results, dirty protection,
  unrelated staged-file preservation, revert success/failure/conflict, and
  post-action status refresh.

### 3. Remote operations

- Extend the same service/router for fetch, push, and pull using existing
  remotes/branches only; never expose URLs or accept arbitrary refspecs.
- Tests use local bare remotes and assert fetch/push/pull results, no retries,
  timeout/error receipts, clean-tree requirements, and credential safety.

### 4. Frontend actions surface

- Files: `frontend/src/lib/api/client.ts`, `frontend/src/App.tsx`,
  `frontend/src/styles.css`.
- Add typed action calls and a repository-level Git Actions view with selected
  file scope, commit message, branch controls, remote controls, revert
  confirmation, progress/error/conflict receipts, and stale-intelligence scan
  guidance.
- Tests/validation: typecheck/build and manual API-backed smoke flow; no mock
  action results.

### 5. Documentation and security review

- Update `README.md` and `frontend/src/lib/api/client.ts` with supported actions,
  prerequisites, confirmation/dirty-tree behavior, remote credential limits,
  conflict handling, stale snapshots, and deferred operations.
- Review for shell injection, path traversal, hooks, mutation leaks, force push,
  raw stderr, credentials, concurrent actions, and false success.

### 6. Full validation and Docker

```bash
cd backend
uv run python -m compileall app
uv run pytest

cd frontend
npm ci
npm run typecheck
npm run build

cd ..
```

Run a disposable non-root container against a temporary Git fixture and local
bare remote. Verify health, status, representative local mutations, stale
intelligence, SQLite persistence, and cleanup.

## Final acceptance criteria

- Required operations are implemented or explicitly deferred with rationale.
- Each implemented operation has behavior-level temporary-repository tests.
- No repository hooks/code execution, unsafe paths, raw errors, credentials,
  force pushes, or silent data loss.
- Existing 43-test backend suite remains green plus action tests.
- Frontend checks and Docker smoke tests pass.
- Final commit: `feat: add essential git actions`.
