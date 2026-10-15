# Dependency Graph Implementation Plan

> **For agentic workers:** Use TDD task-by-task. Do not implement hotspots, test relationships, symbol graph, or AI.

1. Add graph schemas and a projection service using indexed dependency rows;
   test direction, depth, limits, cycles, duplicate edges, ordering, and
   internal-only semantics.
2. Add the READY-only graph API with ownership/state/parameter validation and
   truncation metadata.
3. Add realistic API fixtures covering incoming/outgoing/both, empty graph,
   latest snapshot, and cross-snapshot rejection.
4. Add the existing React Flow package and replace only the graph mock canvas
   with API-backed bounded nodes/edges, inspector, controls, and states.
5. Update docs, run backend/frontend validation, review phase boundaries, and
   commit `feat: add dependency graph`.
