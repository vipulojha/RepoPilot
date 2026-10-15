# Tree-sitter Symbol Intelligence Design

## Scope

Phase 3A adds syntax-only parsing and snapshot-scoped symbols to the Phase 2B
metadata snapshots. It does not extract imports/dependencies, search indexes,
graphs, impact, hotspots, or test relationships.

## Languages and dependency strategy

Initial grammars: Python, JavaScript, TypeScript, TSX, and Java. The Python
`tree-sitter` runtime and separately pinned grammar wheels are registered in one
registry. Adding a language means adding one grammar dependency plus one
registry/extractor definition, not changing the scanner or API layers.

Unsupported languages remain valid Phase 2B files with no symbols and an
unsupported-language warning. Binary, skipped, and empty files are not parsed.

## Parser boundary

`ParserRegistry` maps canonical language names to immutable parser factories.
`parse_source(language, source, path)` returns `ParseResult(tree, warnings,
has_error)`. The parser reads only READY snapshot text files, uses UTF-8 with
replacement for malformed bytes, and never executes repository code. Tree-sitter
error nodes are warnings, not fatal errors. Grammar/runtime failures are
recorded per file and leave the snapshot usable; infrastructure/database
failures fail the new snapshot without changing the previous READY snapshot.

Trees are short-lived: parse one file, extract symbols, persist rows, release
the tree. No repository-wide tree cache is kept.

## Symbol model

Supported kinds: `module`, `namespace`, `class`, `function`, `method`,
`interface`, `type`, `enum`, and `constructor` where the grammar exposes them.
Names come from declaration identifier fields. Anonymous declarations are
ignored unless they have a stable named field. Qualified names join parent
names with `.`; top-level names are their own qualified name. Duplicate rows
are prevented by `(snapshot_id, file_id, qualified_name, kind, start_line,
start_column)`.

Each symbol stores snapshot/file ownership, optional parent symbol, kind, name,
qualified name, zero-based start/end line and column, optional bounded
signature, and creation time. Parent relationships are assigned from the
containment stack while traversing declarations. Source locations are copied
from Tree-sitter nodes and are deterministic.

## Persistence and snapshots

`symbols` belongs to `files`, and `files` belongs to one `scan_snapshots` row.
Symbols are inserted only for the new snapshot while it is scanning/finalizing.
The scan marks READY only after file metadata and symbols commit successfully.
Symbol APIs join through a READY snapshot; a failed or active snapshot is never
the implicit current result.

## API

Add:

- `GET /api/v1/repositories/{repository_id}/symbols` with `snapshot_id`,
  `file_id`, `kind`, `name`, `limit`, and cursor.
- `GET /api/v1/repositories/{repository_id}/files/{file_id}/symbols` with
  `snapshot_id` and pagination.
- `GET /api/v1/repositories/{repository_id}/symbols/{symbol_id}`.

Responses include symbol identity, path, kind, names, locations, signature,
parent ID, and snapshot ID. All omitted snapshot lookups resolve latest READY.

## Failure and performance

Malformed source produces symbols found before/around error nodes plus a parse
warning. Unsupported, binary, oversized, or unreadable files are skipped with
warnings. Parse each file independently, cap source bytes, batch database
writes, and avoid multiprocessing. The first target is 1,000–10,000 files;
unparsed language files must not block supported files.

## Backwards compatibility

Phase 2B file metadata and scan routes remain valid. Existing snapshot rows with
no symbol rows continue to work. Files UI remains visually unchanged; symbol
data is API-first in this phase and does not require a new frontend screen.

## Tests

Fixtures cover Python, JavaScript/TypeScript/TSX, Java, malformed source,
nested declarations, locations, duplicate prevention, unsupported/binary/
empty/oversized files, parse warnings, snapshot isolation, API filtering and
pagination, and previous READY preservation.
