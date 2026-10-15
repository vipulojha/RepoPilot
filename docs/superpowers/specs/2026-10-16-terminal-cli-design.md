# Milestone 5F — Terminal CLI Design

## Purpose and architecture

The CLI is a thin, local adapter over existing services, not a second analysis
engine. It runs from a repository path (default current directory), uses the
same `GitService`, `GitHistoryService`, `ChangeIntelligenceService`, scanner,
database, and existing schemas, and never starts a hidden web server. A
repository-local SQLite database is selected through `REPOPILOT_DATABASE_URL`
or a documented `--database` path; scan creates/uses a registered repository.

The executable is `repopilot`, exposed from the backend `pyproject.toml` as a
console script. Python's standard-library `argparse` avoids a new dependency.

## Commands

Implemented command groups are intentionally explicit:

```text
repopilot --version
repopilot status [PATH]
repopilot scan [PATH]
repopilot files [PATH]
repopilot search QUERY [PATH]
repopilot symbols [PATH]
repopilot dependencies PATH FILE_ID
repopilot impact PATH FILE_ID
repopilot graph PATH FILE_ID
repopilot hotspots [PATH]
repopilot tests PATH FILE_ID
repopilot changes [PATH]
repopilot history [PATH]
repopilot git status [PATH]
```

Commands that need a READY snapshot say so and return a nonzero exit code with
an actionable scan instruction. `git status`, `history`, and `changes` work
without a READY snapshot where Git data permits. Git mutations are not exposed
until their action contract has a dedicated CLI safety design.

## Output and errors

Default output is concise readable text. Every command supports `--json`; JSON
goes only to stdout with stable snake_case fields from service DTOs. Errors go
to stderr and use exit code 2 for invalid arguments, 1 for runtime/service
failure, and 0 for success. Results are bounded with command-specific limits.
No raw Git stderr, credentials, source secrets, or debug traces are printed.

## Security and tests

Paths are canonicalized and passed to existing repository validation. The CLI
does not shell out itself except through existing services, does not execute
hooks/code, and does not accept arbitrary Git commands. Tests invoke the real
console entry point in temporary repositories/databases and verify help/version,
JSON validity, exit codes, scan/READY behavior, search/history/status/changes,
invalid paths, special filenames, and stderr separation.

## Docker and limitations

The production image retains the CLI because it ships the backend package; a
documented temporary writable data volume and repository mount are required for
scan commands. CLI output is local-only and has no remote/cloud dependency.
Interactive graph rendering, rich TUI behavior, Git actions, hosting APIs,
AI summaries, and unlimited output are not implemented.

## Acceptance criteria

- Every advertised command works in readable and JSON modes or is not advertised.
- Real CLI invocation tests pass with deterministic temporary fixtures.
- Snapshot prerequisites and exit codes are actionable and stable.
- Docker can invoke representative CLI commands as non-root.
