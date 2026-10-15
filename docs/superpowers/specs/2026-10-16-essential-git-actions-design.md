# Milestone 5D — Essential Git Actions Design

## Scope and safety boundary

5D adds explicit, repository-scoped mutations for stage, unstage, commit,
branch create/switch, fetch, push, pull, and revert-through-a-new-commit. All
other mutations remain deferred. Merge and cherry-pick are deferred because
conflict lifecycle, safe cancellation, and recovery cannot be implemented
reliably within the current small API/UI without creating unsafe shortcuts.

Every action is an explicit POST, never an arbitrary Git command. The backend
validates the registered Git root, uses the existing `GitService` subprocess
boundary, literal pathspec arguments, bounded output, timeouts, safe errors,
and no shell. The API never returns raw stderr or credentials.

## Existing architecture findings

`GitService` is currently the sole root validator and safe Git subprocess layer;
`GitHistoryService` and `ChangeIntelligenceService` consume it. The repository
database stores only registration and READY snapshots, so Git mutations remain
transient and must refresh status after success. The frontend has shared
repository selection, typed API calls, History, Change Intelligence, and a
Signal Map design, but no mutation architecture. Docker already contains Git
and runs as non-root.

## Proposed architecture

Extend `GitService` with clearly separated typed action methods:

- `stage(paths)` — `git add -- <validated relative paths>`
- `unstage(paths)` — `git restore --staged -- <validated paths>`; for unborn
  HEAD, use `git rm --cached` only for explicitly staged paths and report the
  limitation rather than silently changing content
- `commit(message)` — inspect status first, require non-empty bounded message,
  and run `git commit --no-verify -m <message>` only after the selected scope
  is confirmed; `--no-verify` prevents repository hooks from executing
- `create_branch(name, start_point)` — validate branch name and use
  `git branch <name> <start>`
- `switch_branch(name)` — validate ref and require clean working tree unless
  switching is provably safe; use `git switch <name>`
- `fetch(remote)` — existing remote only, no refspec supplied by the browser
- `push(remote, branch)` — existing remote and local branch only; never force
- `pull(remote, branch)` — existing upstream/selected remote branch only and
  require clean tree; report conflict state without recovery mutation
- `revert(commit)` — validate commit and require clean tree; use
  `git revert --no-edit <sha>`. Git does not provide a `--no-verify` flag for
  revert, so the operation is explicitly documented as the one action whose
  native command may invoke Git's normal revert/commit hook lifecycle; RepoPilot
  still never executes hooks directly, and conflicts are left intact with
  recovery guidance rather than reset.

All actions call one post-operation refresh that returns `GitStatusResponse`,
HEAD metadata, and `intelligence_stale=true` when the working tree/HEAD changed
since the latest READY snapshot. The latest snapshot is never deleted or
rewritten automatically. A subsequent scan is the only way to refresh static
intelligence.

## API contract

Use `/api/v1/repositories/{repository_id}/git/actions` with typed action bodies:

```json
{"action":"stage","paths":["src/a.py"]}
{"action":"unstage","paths":["src/a.py"]}
{"action":"commit","message":"Fix parser boundary"}
{"action":"branch_create","name":"feature/parser","start_point":"HEAD"}
{"action":"branch_switch","name":"feature/parser","confirm_dirty":false}
{"action":"fetch","remote":"origin"}
{"action":"push","remote":"origin","branch":"feature/parser"}
{"action":"pull","remote":"origin","branch":"main"}
{"action":"revert","commit":"<full-or-safe-abbrev-sha>","confirm":true}
```

The response is a typed action receipt:

- `action`, `status` (`succeeded`, `rejected`, `conflict`, `failed`)
- safe user-facing `message` and optional recovery guidance
- refreshed Git status/HEAD
- `intelligence_stale`
- bounded stdout summary where useful, never stderr

Missing repository is 404; malformed input is 422; dirty-tree/preflight
conflicts are 409; Git execution failures are stable 422/409 states. Requests
are serialized per repository in-process to prevent concurrent mutations from
interleaving. No automatic retries are performed for network actions.

## Validation rules

- Paths must be non-empty repository-relative POSIX paths, cannot begin with
  `/` or contain `..`, and are passed after `--`.
- Branch names use `git check-ref-format --branch` and are capped in length.
- Commit identifiers are verified with `rev-parse --verify <sha>^{commit}` and
  are never interpolated into shell text.
- Remote names must match an existing configured remote; URLs are never shown.
- Commit messages are trimmed, non-empty, bounded, and never auto-generated.
- Commit only affects already staged files; unrelated staged files are exposed
  in the preflight receipt and require explicit confirmation.
- Push/pull/fetch require a selected existing remote and bounded execution.

## Frontend behavior

Add a focused Git Actions surface using the shared repository. It shows current
staged scope before commit, offers per-file stage/unstage controls, validates a
commit message, supports branch create/switch, and presents remote operations.
Revert requires explicit confirmation displaying the target commit. Pull,
push, fetch, and branch switching show progress and disable conflicting
controls. No optimistic success is rendered; the response refreshes status.

The surface clearly marks static intelligence as stale after successful content
or branch mutations and offers “Scan to refresh intelligence”. Conflict/error
responses preserve the backend state and recovery guidance. Existing History,
Change Intelligence, File Hub, and repository selection remain intact.

## Security model

No shell commands, shell interpolation, arbitrary refspecs, force push,
credentials, raw stderr, or repository code execution. `--no-verify` is used
for commit. Revert has no native `--no-verify` option and is the documented
exception: RepoPilot does not invoke hooks directly, requires a clean tree, and
leaves conflicts intact. Remote operations rely on
the user's configured Git credential helper/environment but RepoPilot never
reads, stores, or logs credentials. All output is bounded and all commands
timeout.

## Testing strategy

Use temporary Git repositories and isolated SQLite databases. Test each action's
actual repository result plus receipt/status refresh: stage, unstage, commit,
branch create/switch, dirty-tree protection, invalid paths/refs/messages,
revert, special filenames, stale intelligence, non-Git/detached/unborn states,
conflict/error handling, timeout, no hook execution, and no unrelated staged
files being silently committed. Network fetch/push/pull use local bare remotes,
never GitHub or the network.

## Docker validation

Build the production image, run as non-root with a temporary fixture and named
SQLite volume, register the fixture, exercise representative stage/unstage/
commit/branch actions through the API, verify health/status/stale state, and
clean all containers, volumes, and fixtures. Remote operations are tested with
a local bare repository mounted into the disposable fixture only.

## Deferred operations

Merge and cherry-pick are deferred until conflict lifecycle, abort/recovery,
and post-operation semantics have dedicated design and tests. Reset, rebase,
force-push, interactive rebase, stash, branch deletion, hosting integrations,
CLI, and AI summaries are out of scope.

## Acceptance criteria

- All required core actions have typed APIs and meaningful isolated tests.
- No action can escape the registered repository or execute hooks/code.
- Failed/conflicted operations never report false success or silently discard
  changes.
- Successful mutations refresh Git state and mark READY intelligence stale.
- Frontend requires confirmation for risky operations and disables concurrency.
- Existing read-only Git/history/change endpoints remain green.
- Backend/frontend/Docker validation passes and the working tree is clean after
  the focused commit.
