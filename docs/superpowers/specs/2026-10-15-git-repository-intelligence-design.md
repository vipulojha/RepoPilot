# Git Repository Intelligence Design

## Boundary

RepoPilot adds one reusable backend Git service and one read-only API surface:
`GET /api/v1/repositories/{repository_id}/git/status`. The service receives a
registered repository root, validates it, executes bounded Git subprocesses
with argument arrays and `shell=False`, and returns typed transient state. No
Git state is persisted.

## Security and execution

The registered path must resolve to an existing directory and Git commands run
with `cwd` equal to that directory. The service verifies the repository using
`git -C <root> rev-parse --show-toplevel`, requiring the resolved top-level
directory to equal the registered root. Commands have a short timeout, bounded
output, sanitized environment, and safe error mapping. Hooks are not invoked;
all commands are read-only. Remote URLs are sanitized by removing user-info
credentials before returning them.

## Domain model and semantics

Typed models describe repository presence, branch or detached HEAD, HEAD SHA,
short SHA, subject, safe author/timestamp, working-tree entries (including
porcelain status and rename paths), conflict state, upstream, ahead/behind,
remotes, local branches, tags, shallow state, and capability/error messages.
Empty repositories, non-Git directories, missing Git, inaccessible roots, and
malformed repositories are distinct safe states rather than 500 errors.

Status uses `git status --porcelain=v1 -z -uall` for machine-readable files,
`rev-parse` for branch/HEAD/upstream, `rev-list --left-right --count` for
ahead/behind when an upstream exists, and NUL-delimited `for-each-ref` output
for remotes, branches, and tags. Detached HEAD has no branch; no upstream has
null ahead/behind. Shallow state is reported from `rev-parse --is-shallow-repository`.

## API and frontend

The API validates repository ownership through the existing database lookup and
returns one complete snapshot to avoid subprocess fan-out. The frontend API
client adds a typed `gitStatus` call. A compact repository-level Git panel is
shown on the Dashboard, reusing existing panels, badges, focus styles, and
responsive layout. It has loading, refresh, non-Git, detached, no-upstream,
empty, and error states. Refresh is explicit and selection changes fetch fresh
state; no long-lived cache is introduced.

## Compatibility and tests

The Git service is independent of routes and UI so History, Change
Intelligence, Git Actions, and CLI can reuse it later. Tests use temporary Git
repositories and fake command runners, never `/home/RepoPilot`, network, or
GitHub. Coverage includes clean/dirty status classes, rename/conflict,
branches, detached/empty/shallow repositories, upstream ahead/behind/diverged,
multiple remotes, credential sanitization, boundaries, missing Git, timeouts,
and safe errors.
