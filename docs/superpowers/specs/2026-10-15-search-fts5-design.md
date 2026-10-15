# Search and FTS5 Design

Phase 3C adds snapshot-scoped SQLite FTS5 search for file paths/names, symbols,
and source text. It does not add graph, impact, hotspot, test relationship, or
AI functionality.

## Index

Create one FTS5 table, `search_documents`, with `snapshot_id`, `entity_type`,
`file_id`, `symbol_id`, `path`, `name`, and `content`; snapshot/entity IDs are
UNINDEXED identity columns. File documents index paths/names/content for TEXT
files. Symbol documents index name/qualified name/path. Binary, skipped,
oversized, and unreadable source are metadata/path-searchable only.

Rows are written while a new snapshot is built and deleted with failed snapshot
cleanup. READY is set only after files, symbols, dependencies, and documents
commit. Previous READY rows remain untouched during a new scan.

## Queries and ranking

The API accepts plain developer text, not raw FTS syntax. Normalize whitespace,
split tokens, quote each token, and join with `AND`; empty/invalid input is
`422`. This prevents FTS operators and SQL injection from changing query
meaning. Rank deterministically: exact symbol/name/path, symbol, file/path,
then code, with `bm25` as a stable secondary score. Results are typed as
`file`, `symbol`, or `code` and include bounded snippets, path, language,
symbol identity, and line where known.

Pagination uses an integer cursor over stable result ordering plus a limit.
Snapshot selection defaults to latest READY and explicit snapshots must belong
to the repository and be READY. Malformed source or an individual indexing
failure becomes a warning; infrastructure/FTS failure fails only the new
snapshot. Rebuild is a per-snapshot delete/reinsert operation.

## API and performance

`GET /api/v1/repositories/{repository_id}/search` accepts `q`, `snapshot_id`,
`scope=all|files|symbols|content`, `language`, `limit`, and `cursor`. Use one
SQLite transaction/batch per scan and one bounded query per request. Do not
load entire repositories or duplicate skipped source.

Tests cover paths, names, symbols, qualified names, source text, exact/partial
matches, snippets, ranking, punctuation, empty queries, malformed FTS input,
binary/oversized files, pagination, READY isolation, and failed snapshots.
