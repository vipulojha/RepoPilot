# Test Relationship Intelligence Design

Phase 3G derives static associations between classified test files and source
files within one READY snapshot. It never executes tests or claims runtime
coverage.

Relationships have two kinds: `direct_dependency` (strong evidence: an
existing internal dependency from test file to source file) and
`naming_convention` (heuristic evidence: exact deterministic filename stem
pairing such as `foo.test.ts` and `foo.ts`). Direct dependency wins when both
exist. External/unresolved dependencies are ignored. Ambiguous names produce
no relationship.

The existing scanner `is_test` flag is authoritative. Source files are
non-test TEXT files in the same snapshot. Relationships are derived from
persisted files/dependencies without filesystem traversal, reparsing, or test
execution. Results are ordered by relationship strength, source path, then
test path. APIs resolve latest READY by default and reject non-READY or foreign
snapshots.

Routes expose tests for a source file and tested sources for a test file. Each
result includes both file IDs/paths, kind, evidence level, and evidence text.
No percentage coverage, pass/fail, framework execution, or inferred runtime
behavior is reported.
