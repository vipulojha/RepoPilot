# Milestone 5E — Advanced Git Workflows Plan

1. Add stash action literals/request validation and reusable `GitService` stash
   methods; test refs, preconditions, special names, status refresh, and stale
   receipts in `backend/tests/test_git_actions.py`.
2. Add stash API/UI controls to the existing Git Actions surface; keep risky
   operations confirmed and busy-state serialized.
3. Run the full 5D regression suite, frontend checks, security review, and
   disposable Docker stash smoke test.
4. Update README/API docs and commit `feat: add advanced git workflows`.

Deferred merge/cherry-pick require a future conflict lifecycle design.
