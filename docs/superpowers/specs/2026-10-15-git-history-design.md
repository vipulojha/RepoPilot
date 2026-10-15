# Git History Intelligence Design

History is a read-only consumer of the existing `GitService`. A bounded
`GitHistoryService` executes machine-readable `git log`, `show`, `diff`, and
`rev-list` commands through the existing root validation, timeout, and safe
argument boundary. It returns historical facts only; no repository state is
mutated and no patch body is returned by default.

The API uses the existing `/api/v1/repositories/{repository_id}/git` namespace:
`GET /history`, `GET /commits/{sha}`, `GET /files/{file_id}/history`, and
`GET /compare`. History accepts bounded page/limit parameters, commit detail is
bounded by file count, and comparison is bounded by file and commit limits.
Branch history is the same history endpoint with a validated local branch/ref.

Commit metadata includes full/short SHA, subject, author, timestamp, parents,
merge flag, and changed-file/stat totals. File history preserves rename paths.
Comparison uses two-point `git diff --numstat` plus `rev-list` counts without
loading patch contents. Malformed or invalid SHAs produce safe 404/422 errors;
huge output is truncated deterministically.

Current RepoPilot intelligence is explicitly separate. Where a current READY
snapshot exists, commit/file results may include current file IDs and current
hotspot/dependency/impact/test context. That context is labeled current and is
never described as historical impact. Without READY data, historical endpoints
remain useful and current context is unavailable.

The frontend adds a compact History surface and commit detail view, with file
links into the existing File Intelligence Hub. Loading, empty, non-Git,
detached, invalid commit, pagination, and truncation states reuse existing
Signal Map components and focus styles.

Security uses argument arrays, bounded subprocess output, timeouts, root/ref
validation, no hooks, no stderr exposure, no credentials, and no patch content.
Temporary Git fixtures cover metadata, renames/deletes, branches, detached and
empty repositories, comparisons, bounds, unusual names, and safe failures.
