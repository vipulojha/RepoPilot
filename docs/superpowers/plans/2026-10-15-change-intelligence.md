# Change Intelligence Implementation Plan

1. Add typed change-analysis schemas and `backend/app/services/changes.py`.
   Compose `GitService`, `analyze_impact`, existing hotspot queries, and
   `relationships`; keep Git and traversal logic single-sourced.
2. Add `backend/app/api/v1/changes.py`, register it in `main.py`, and document
   `GET /api/v1/repositories/{repository_id}/changes`.
3. Add temporary-Git backend tests for status classes, diff stats, snapshot
   resolution, impact/test/hotspot composition, risk, bounds, errors, and
   security-sensitive filenames.
4. Add typed client DTOs and a Change Intelligence page/navigation entry in
   `frontend/src/App.tsx`, reusing File Hub, Hotspots, Tests, and existing focus
   styles.
5. Run compile/tests, frontend checks, security review, Docker build/runtime
   clean-and-dirty smoke tests, diff checks, then commit the feature.
