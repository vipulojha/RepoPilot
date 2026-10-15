# RepoPilot REST API Design

Status: Phase 1 specification. Shapes are contracts for future implementation;
no endpoints exist yet.

## Conventions

- Base path: `/api/v1`.
- JSON uses camelCase at the HTTP boundary; storage may use snake_case.
- Every query response includes `snapshotId` where repository data is involved.
- Relative repository paths use `/` separators and never begin with `..`.
- Paginated collections use `{items, nextCursor, hasMore}`.
- Errors use `{error: {code, message, details?, requestId?}}`.
- `409` means a conflicting scan or stale snapshot; `422` means invalid input.
- `404` means the repository, snapshot, file, symbol, or result is absent.
- `413` means a graph/search/scan limit was exceeded.

## Shared shapes

```json
{
  "repositoryId": "repo_local",
  "snapshotId": "snap_2026_01",
  "status": "ready",
  "warnings": []
}
```

```json
{
  "path": "src/auth/AuthService.ts",
  "language": "typescript",
  "kind": "file",
  "line": 12,
  "column": 4,
  "snippet": "export class AuthService ..."
}
```

## Repository and scan

### `POST /repositories`

Register a repository already available under the configured root.

Request:

```json
{"path":"/workspace/repo","displayName":"sample-repo"}
```

Response `201`: `{repository, latestSnapshot: null}`. Errors: `400` malformed
path, `403` outside allowed root, `404` missing path.

### `GET /repositories`

List registered repositories. Response: `{items: [{id, displayName, rootLabel,
latestSnapshot}]}`. Errors: `500` storage failure.

### `GET /repositories/{repositoryId}`

Return repository metadata and latest snapshot summary. Errors: `404` unknown
repository.

### `POST /repositories/{repositoryId}/scans`

Start a scan. Request: `{"force":false,"parseMode":"default"}`. Response
`202`: `{analysisId, snapshotId, status:"queued"}`. Errors: `409` scan already
running, `422` invalid mode, `404` repository missing.

### `GET /scans/{analysisId}`

Return lifecycle and progress:

```json
{
  "analysisId":"analysis_1", "snapshotId":"snap_1", "status":"running",
  "phase":"parsing", "processedFiles":120, "totalFiles":400,
  "percent":30, "warnings":[], "startedAt":"..."
}
```

Errors: `404` unknown analysis.

### `POST /scans/{analysisId}/cancel`

Request cancellation. Response `202`: `{analysisId, status:"cancelling"}`.
Errors: `404` unknown analysis, `409` scan already terminal.

## Overview and files

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/overview`

Return counts, languages, largest files, directory groups, scan duration, and
warning summary. Response:

```json
{
  "snapshotId":"snap_1",
  "files":{"total":420,"parsed":380,"binary":12},
  "languages":[{"id":"typescript","fileCount":180,"lineCount":24000}],
  "symbols":{"total":3400,"functions":2100,"classes":120},
  "dependencies":{"resolved":900,"unresolved":20,"cycles":3},
  "tests":{"files":42,"symbols":118},
  "topDirectories":[{"path":"src","fileCount":260}]
}
```

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/files`

Return the file tree or a paged flat list. Query: `parentPath`, `depth`,
`cursor`, `limit`, `sort`, `language`, `includeGenerated`. Response:
`{items: [{id,path,name,type,size,language,isGenerated,childCount}], ...}`.
Errors: `422` invalid limit/filter.

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/files/{fileId}`

Return metadata, source content when permitted, diagnostics, symbols, imports,
and summary dependencies. Query: `content=true`, `lineStart`, `lineEnd`.
Response: `{file, content?, symbols, imports, dependencies, diagnostics}`.
Errors: `404` unknown file, `413` content too large.

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/files/by-path`

Resolve a repository-relative path. Query: `path`. Response: `{file}`. Errors:
`400` unsafe path, `404` not found.

## Symbols and relationships

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/symbols`

Search or list symbols. Query: `q`, `kind`, `filePath`, `language`, `cursor`,
`limit`. Response: `{items: [{id,fileId,path,name,qualifiedName,kind,range,
exported}], ...}`. Errors: `422` invalid query.

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/symbols/{symbolId}`

Return definition, parent, children, incoming/outgoing relationships, and
source location. Errors: `404` unknown symbol.

## Dependency graph

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/graph`

Return a bounded graph projection. Query:

`root`, `direction=incoming|outgoing|both`, `depth`, `nodeType=file|module|symbol`,
`edgeKinds`, `pathPrefix`, `language`, `groupBy=directory|module|language`,
`includeExternal`, `includeUnresolved`, `limit`.

Response:

```json
{
  "nodes":[{"id":"file:12","label":"AuthService.ts","path":"src/auth/AuthService.ts","group":"auth","metrics":{"inDegree":4}}],
  "edges":[{"id":"dep:88","source":"file:20","target":"file:12","kind":"import","confidence":"high","evidence":[{"line":3}]}],
  "truncated":false,
  "filters":{"depth":2,"nodeType":"file"}
}
```

Errors: `404` root missing, `413` requested limit above server maximum, `422`
invalid filter.

## Search

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/search`

Query: `q`, `scope=all|files|symbols|imports|content`, `kind`, `language`,
`pathPrefix`, `caseSensitive`, `cursor`, `limit`. Response:

```json
{
  "items":[{"type":"symbol","id":"sym_1","path":"src/auth/AuthService.ts","name":"AuthService","kind":"class","score":1.0,"snippet":"..."}],
  "query":"AuthService","nextCursor":null,"hasMore":false
}
```

Errors: `422` empty/invalid query, `503` index unavailable.

## Impact analysis

### `POST /repositories/{repositoryId}/snapshots/{snapshotId}/impact`

Request:

```json
{
  "root": {"type":"file","id":"file_12"},
  "direction":"incoming",
  "maxDepth":3,
  "edgeKinds":["import","test_reference"],
  "includeTests":true,
  "includeExternal":false
}
```

Response:

```json
{
  "impactId":"impact_1","root":{"path":"src/auth/AuthService.ts"},
  "summary":{"direct":2,"transitive":3,"tests":2,"lowConfidence":1},
  "groups":[
    {"category":"direct","items":[{"path":"src/auth/AuthController.ts","distance":1,"confidence":"high","evidence":[{"kind":"import","line":4}]}]},
    {"category":"tests","items":[{"path":"tests/auth.test.ts","distance":1,"confidence":"high"}]}
  ],
  "truncated":false,"warnings":[]
}
```

Errors: `404` root missing, `409` snapshot not ready, `422` invalid depth,
`413` impact exceeds configured limit.

## Tests and hotspots

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/tests`

Query: `pathPrefix`, `framework`, `cursor`, `limit`. Response:
`{items: [{id,path,name,frameworkHint,linkedFiles,confidence}], ...}`.

### `GET /repositories/{repositoryId}/snapshots/{snapshotId}/hotspots`

Query: `metric=complexity|fanIn|fanOut|size|combined`, `limit`, `pathPrefix`.
Response: `{items: [{fileId,path,score,metrics,reasons}], ...}`. Hotspots are
heuristics, not defect claims.

## API implementation rules

- Server-side defaults cap `limit`, `depth`, source bytes, and response size.
- Snapshot readiness is checked consistently by a dependency.
- Long scans are jobs; graph/search/impact remain request/response queries.
- Request IDs appear in logs and error envelopes, never source content.
- DTO contract tests pin the shapes above before frontend integration.

## Phase 2B metadata scan

Phase 2B implements metadata-only scanning. A scan creates a snapshot and file metadata; it does not parse symbols, resolve imports, build graphs, or index search content.

Implemented routes:

- `POST /repositories/{repositoryId}/scans` accepts `{"force": false}`.
- `GET /repositories/{repositoryId}/scans` lists snapshots newest first.
- `GET /repositories/{repositoryId}/scans/latest` returns the latest READY snapshot only.
- `GET /repositories/{repositoryId}/scans/{scanId}` returns lifecycle and progress.
- `GET /repositories/{repositoryId}/files` supports `snapshot_id`, `path_prefix`, `language`, `is_test`, `limit`, and cursor pagination.
- `GET /repositories/{repositoryId}/files/{fileId}` returns file metadata.
- `GET /repositories/{repositoryId}/files/tree` supports `snapshot_id`, `parent_path`, `depth`, and `include_files`.

Only READY snapshots are valid file/API data. The scanner excludes `.git/`, default build/cache directories, and repository `.gitignore` matches. Binary and oversized files are recorded safely. Tree-sitter, symbols, dependencies, FTS5 search, graphs, and impact analysis remain future phases.

## Phase 3A symbol intelligence

Phase 3A adds syntax-only Tree-sitter parsing for Python, JavaScript, JSX, TypeScript, TSX, and Java. Supported declarations become snapshot-scoped symbols with names, qualified names, source ranges, signatures, and parent IDs. Malformed source produces warnings; unsupported, binary, empty, or oversized files remain valid metadata files without symbols.

Implemented routes:

- `GET /repositories/{repositoryId}/symbols` accepts `snapshot_id`, `file_id`, `kind`, `name`, `limit`, and cursor.
- `GET /repositories/{repositoryId}/files/{fileId}/symbols` lists symbols for a READY file snapshot.
- `GET /repositories/{repositoryId}/symbols/{symbolId}` returns one symbol.

Import/dependency extraction, FTS5 search, graph analysis, impact analysis, hotspots, and AI remain outside Phase 3A.
