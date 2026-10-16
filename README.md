# RepoPilot

RepoPilot is a local-first repository intelligence workbench. It scans a codebase
without executing its source, builds a snapshot of files, symbols, imports, and
static test relationships, and exposes that information through a FastAPI API,
React workspace, and terminal CLI.

The frontend uses the Stitch handoff in
`repopilot-design-system-&-handoff-suite/` as its visual reference. That folder
contains reference tokens, screen specifications, and prototype components; the
production application is in `frontend/` and `backend/`.

## Features

- Repository onboarding from a local folder, GitHub URL, or source file path.
- Snapshot scanning with language, size, line, warning, and classification data.
- Files explorer and IDE-like source/file intelligence view.
- FTS5 code, file, symbol, and source search.
- Dependency graph with repository and selected-file focus modes.
- Reverse-dependency impact analysis with direct and transitive paths.
- Structural hotspot ranking from deterministic repository signals.
- Static test/source relationship inspection. RepoPilot does not execute tests or
  claim runtime coverage.
- Git status, change intelligence, history, commit details, file history, and
  compare views.
- Explicit Git actions for selected files, branches, remotes, commits, and stashes.
- Responsive Obsidian Telemetry shell, repository selector, command palette, and
  explicit loading, empty, error, and action-feedback states.
- Terminal CLI for scan, summary, files, search, dependency, impact, hotspot,
  test, and Git inspection workflows.

## Architecture

```text
frontend/                 React + TypeScript + Vite
  src/App.tsx             application composition and navigation state
  src/components/rebuild  Stitch-derived shell and workspaces
  src/lib/api/client.ts   typed API client
backend/                  Python 3.12 + FastAPI + SQLAlchemy
  app/services             scanning, parsing, search, graph, impact, Git
  app/api/v1               REST endpoints
  tests/                   backend API and service tests
repopilot.db              local development database; ignored by Git
```

The backend stores local metadata in SQLite and uses FTS5 for search. Tree-sitter
parsers provide syntax-only symbol extraction for the supported languages. Git
operations are constrained to the registered repository root and never accept
credentials from the API.

## Prerequisites

- Linux or WSL2.
- Node.js 22, pinned by `.nvmrc`.
- Python 3.12, pinned by `backend/.python-version` and constrained in
  `backend/pyproject.toml`.
- `npm` and [`uv`](https://docs.astral.sh/uv/).
- Docker 20.10+ only for the container workflow.

The frontend dependency versions are exact and recorded in
`frontend/package-lock.json`. Python versions are resolved in `backend/uv.lock`.

## Clean local setup

From the repository root:

```bash
uv sync --directory backend --dev
npm --prefix frontend ci
```

Or use the convenience target:

```bash
make setup
```

Copy `.env.example` to `.env` only when local configuration needs to override the
defaults. Never commit `.env` or credentials.

## Run locally

Start the backend in one terminal:

```bash
uv run --directory backend uvicorn app.main:app --reload \
  --host 127.0.0.1 --port 8000
```

Start the Vite frontend in another terminal:

```bash
npm --prefix frontend run dev
```

Open `http://127.0.0.1:3000`. Vite proxies `/api` to the backend at
`http://127.0.0.1:8000`. Verify the backend directly with:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

## Test, typecheck, and build

The one obvious repository-level check is:

```bash
sh ./test.sh
```

It runs backend bytecode compilation, all backend tests, frontend TypeScript
typechecking, and the production frontend build. It does not install packages, so
it works offline after the setup commands have completed. If GNU make is
available, `make test` runs the same checks.

The individual commands are:

```bash
uv run --directory backend python -m compileall app
uv run --directory backend pytest
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

## Docker

The Dockerfile uses Node 22 and Python 3.12, installs the locked frontend and
backend dependencies, serves the built frontend through FastAPI, and runs as a
non-root user. The initial image build needs network access to download base
images and packages; the runtime uses the frozen environment from the image and
does not re-sync dependencies on startup.

```bash
docker build -t repopilot:local .
docker volume create repopilot-data
docker run --name repopilot-local -p 3000:3000 \
  -v repopilot-data:/app/data \
  -v "$PWD:/workspace:ro" \
  repopilot:local
```

The container serves the UI and API at `http://127.0.0.1:3000`. Check it with:

```bash
curl http://127.0.0.1:3000/api/v1/health
docker ps
docker logs repopilot-local
```

Register `/workspace` through the onboarding UI or API to scan the mounted
repository. Stop the disposable container with:

```bash
docker rm -f repopilot-local
```

## CLI

The backend package installs a `repopilot` command through `uv`:

```bash
uv run --directory backend repopilot --help
uv run --directory backend repopilot status --json /path/to/repository
uv run --directory backend repopilot history --limit 20 /path/to/repository
uv run --directory backend repopilot changes /path/to/repository
```

For snapshot-scoped commands, use one persistent database and scan first:

```bash
uv run --directory backend repopilot --database /tmp/repopilot.db \
  scan /path/to/repository
uv run --directory backend repopilot --database /tmp/repopilot.db \
  summary /path/to/repository
```

CLI mutations are intentionally unsupported. Use the validated API Git Actions
workspace for repository mutations.

## Configuration

`.env.example` documents the supported local variables, including backend host,
port, database URL, CORS origins, scan limits, and `VITE_API_BASE_URL`.

The frontend does not contain API keys or provider credentials. Git remote output
is sanitized by the backend before it reaches the UI.

## Limitations

- Static test relationships are not runtime test execution or coverage data.
- Analysis is snapshot-scoped; changes after a scan can make intelligence stale
  until a new scan is run.
- Parser and import extraction support the languages implemented by the backend
  parser registry; unsupported files remain visible with metadata.
- Standalone file onboarding detects repository context, but source intelligence
  still operates through a registered repository snapshot.
- There is no hosted public demo URL or recorded demo video in this repository.
- The Docker image is a single-container local/self-hosted deployment; production
  TLS, authentication, and multi-user hosting are outside this project scope.

## Design handoff reference

The committed `repopilot-design-system-&-handoff-suite/` directory is reference
material for the Obsidian Telemetry visual language. The production app does not
run that prototype package or depend on its external integrations.

## License

See [LICENSE](LICENSE).
