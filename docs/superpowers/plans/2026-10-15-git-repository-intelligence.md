# Git Repository Intelligence Implementation Plan

1. Add typed Git schemas and a reusable bounded subprocess service under
   `backend/app/services/git.py`; add focused Git API routes under
   `backend/app/api/v1/git.py` and register them in `main.py`.
2. Extend `frontend/src/lib/api/client.ts` with Git DTOs and the status call;
   add a compact repository Git panel to the existing Dashboard in
   `frontend/src/App.tsx`, using existing Signal Map styles.
3. Add temporary-repository service/API tests covering status classes,
   branch/HEAD/upstream/remotes, sanitization, detached/empty/non-Git cases,
   path boundaries, missing executable, and timeout/error handling.
4. Update API documentation and README milestone notes only as needed.
5. Run backend compile/tests, frontend `npm ci`, typecheck/build, security
   review, Docker build/runtime Git smoke test, `git diff --check`, then commit
   `feat: add git repository intelligence`.
