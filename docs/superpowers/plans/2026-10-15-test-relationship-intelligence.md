# Test Relationship Intelligence Implementation Plan

> **For agentic workers:** Use TDD task-by-task. Do not implement test execution, coverage, Git analytics, graph redesign, or AI.

1. Add relationship schemas and a derived service reusing existing file and
   dependency rows; test direct, naming, precedence, ambiguity, deduplication,
   ordering, and snapshot behavior.
2. Add source→tests and test→sources READY-only APIs with ownership and type
   validation, pagination if needed, and API tests.
3. Add real fixture coverage for multiple tests/sources, external/unresolved,
   binary/skipped/empty/no-test cases and regression suite.
4. Replace the mock Tests screen with real API data while preserving Signal Map
   styling and explicit static-evidence language.
5. Update docs, validate backend/frontend, review boundaries, and commit
   `feat: add test relationship intelligence`.
