# Dependency Intelligence Design

Phase 3B transforms snapshot-scoped files and syntax facts into deterministic
file-level dependency relationships. It does not implement search, graphs,
impact, hotspots, test relationships, or AI.

## Model and semantics

Each `Dependency` belongs to one snapshot and has source file, optional target
file, imported/module name, kind, resolution status (`internal`, `external`,
`unresolved`), evidence, source line/column, and timestamps. Internal means a
repository file resolved deterministically. External means a package/module
name is clearly outside the repository. Unresolved means a statement exists but
resolution is not confident. Unresolved is never silently internal.

Edges point source consumer to target provider. Existing indexes support both
forward and reverse queries without rescanning the filesystem. Duplicate edges
are removed by snapshot/source/name/kind/location/target identity.

## Extraction and resolution

Tree-sitter trees are reused while each text file is processed. Language-aware
node types extract imports: Python import/from-import, JS/TS import/export
source nodes and require calls where syntax exposes them, and Java import
declarations. Resolvers build one in-memory map from repository-relative paths.

Relative JS/TS imports try the requested path, supported extensions, then
`index` files. Python converts relative module names from the source file's
package path and tries `.py` and package `__init__.py`; absolute imports are
internal only when a matching repository path exists, otherwise external when
the root module is package-shaped. Java maps package/import names to `.java`
files by package declaration/path where deterministic. Build aliases, runtime
reflection, generated modules, and dependency manifests are unresolved.

## APIs and failures

Add file forward dependencies, file reverse dependents, and dependency detail
routes under `/api/v1`. All implicit snapshots resolve latest READY; explicit
snapshots must belong to the repository and be READY. Parse errors and one-file
resolution errors become evidence/warnings; database/root failures fail only the
new snapshot and preserve the previous READY snapshot.

## Performance and tests

Build one path map per scan; do not filesystem-stat every import. Persist in
batches. Tests cover all supported languages, internal/external/unresolved,
relative resolution, duplicates, reverse queries, snapshot isolation, malformed
source, missing targets, and READY-only behavior. Target 1,000–10,000 files
without multiprocessing or a worker system.
