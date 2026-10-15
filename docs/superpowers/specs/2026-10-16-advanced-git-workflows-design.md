# Milestone 5E — Advanced Git Workflows Design

## Scope

5E selects stash management as the smallest useful advanced workflow that can
be made safe and tested completely on top of the existing `GitService`. It
adds create, list, apply, pop, and explicitly confirmed drop. Cherry-pick and
merge remain deferred because conflict continuation/abort and recovery need a
larger lifecycle than the current action receipt supports.

## Architecture and API

Extend `GitService` and the existing action router; do not create another
subprocess wrapper. Use the same repository root validation, argv arrays,
timeouts, bounded output, serialized per-repository lock, status refresh, and
stale-intelligence receipt used by 5D.

Add typed operations under the existing action endpoint:

```json
{"action":"stash_create","message":"wip parser"}
{"action":"stash_list"}
{"action":"stash_apply","stash":"stash@{0}"}
{"action":"stash_pop","stash":"stash@{0}","confirm":true}
{"action":"stash_drop","stash":"stash@{0}","confirm":true}
```

Stash refs are validated against bounded `git stash list` output and accepted
only as Git's `stash@{N}` form. Create requires a dirty tree and uses
`git stash push --include-untracked --message`. Apply requires a clean tree;
pop/drop require explicit confirmation. Conflicts are reported and preserved,
never reset or auto-resolved. Receipts refresh status and mark intelligence
stale after content changes.

## Security

No arbitrary Git arguments, shell execution, hooks, credentials, raw stderr,
force operations, or destructive recovery shortcuts. Stash messages and refs
are bounded. Every mutation is serialized per repository. Temporary tests use
isolated repositories and local filesystem only.

## UI, tests, Docker, and non-goals

The existing Git Actions view gains stash create/list/apply/pop/drop controls
with confirmation and conflict/error receipts. Tests assert actual stash
contents/status, ref validation, clean/dirty preconditions, special filenames,
stale receipts, and failed-operation truthfulness. Docker smoke tests run stash
operations as non-root. Merge, cherry-pick, reset, rebase, force-push, stash
automation, hosting integrations, CLI, and AI remain out of scope for 5E.

## Acceptance criteria

- All five stash operations have typed API behavior and dedicated tests.
- User changes and conflicts are never silently discarded.
- Read-only 5A–5C behavior remains green.
- Frontend and Docker validation pass.
