# Impact Analysis Implementation Plan

> **For agentic workers:** Use TDD task-by-task. Do not implement graph UI, hotspots, test relationships, or AI.

1. Add impact request/response schemas and an iterative reverse traversal
   service with depth, cycle, root deduplication, evidence/path, and stable
   ordering tests.
2. Add the POST impact API with READY snapshot and changed-file ownership
   validation, bounded depth, and consistent errors.
3. Add realistic dependency fixtures/tests for direct, transitive, multiple,
   overlapping, cycle, external, unresolved, empty, and snapshot cases.
4. Replace only the existing Impact Analysis mock data with real API state;
   preserve Signal Map styling and loading/error/empty states.
5. Update API/architecture/UI/README documentation, run full validation, review
   for phase boundaries, and commit `feat: add impact analysis`.

Every task follows failing test, expected failure, minimal implementation,
targeted test, broader suite.
