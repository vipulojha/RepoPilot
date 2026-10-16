# RepoPilot

RepoPilot is a local-first repository intelligence workbench. It scans a codebase
without executing its source, builds a snapshot of files, symbols, imports, and
static test relationships, and exposes that information through a FastAPI API,
React workspace, and terminal CLI.

The frontend uses the Stitch handoff in
`repopilot-design-system-&-handoff-suite/` as its visual reference. That folder
contains reference tokens, screen specifications, and prototype components; the
production application is in `frontend/` and `backend/`.

## Product Demo

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/vipulojha/RepoPilot@main/RepoPilot_product_film_visualiza%E2%80%A6_1080p_20261016191317.mp4">
    <img src="./docs/assets/repopilot-demo.gif" alt="RepoPilot cinematic product demo" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/vipulojha/RepoPilot@main/RepoPilot_product_film_visualiza%E2%80%A6_1080p_20261016191317.mp4">▶ Watch the full RepoPilot demo</a>
</p>

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

The runtime image uses the current pinned `python:3.12-slim` Debian base. It
keeps Debian's `git` package because repository onboarding, Git status, history,
compare, and Git actions invoke the `git` executable. It does not keep `uv`,
pip, compilers, headers, or Python build dependencies. The Dockerfile fails the
build if an installed `libexpat1` is older than `2.9.0-1~deb13u1`; the final
image verifies `libexpat1=2.9.0-1~deb13u1`. Docker Scout currently reports zlib
with no available fixed release. `zlib1g` cannot be removed without breaking
Python's `zlib` extension and the Git executable, both of which link to
`libz.so.1`; this is not hidden with a scanner exclusion. RepoPilot has no
application-level calls to `gzwrite`, `gzprintf`, or `gzvprintf`, the vulnerable
non-blocking `gz_*` path in CVE-2026-85091, and its scanner processes source
files rather than archives. Debian's tar package is retained because dpkg
depends on it in the supported slim base.

```bash
docker build -t repopilot:local .
docker volume create repopilot-data
docker run --name repopilot-current -p 3105:3000 \
  -v repopilot-data:/app/data \
  -v "$PWD:/workspace:ro" \
  repopilot:local
```

The container serves the UI and API at `http://127.0.0.1:3105` (host `3105` mapped to the application port `3000`). Check it with:

```bash
curl http://127.0.0.1:3105/api/v1/health
docker ps
docker logs repopilot-current
```

For the security verification requested for the release image, run:

```bash
docker run --rm repopilot:high-fixed sh -c '
  set -eu
  status="$(dpkg-query -W -f="${Status}" libexpat1 2>/dev/null || true)"
  if [ "$status" = "install ok installed" ]; then
    version="$(dpkg-query -W -f="${Version}" libexpat1)"
    dpkg --compare-versions "$version" ge "2.9.0-1~deb13u1"
    printf "libexpat1=%s\\n" "$version"
  else
    printf "libexpat1=not-installed\\n"
  fi
  dpkg-query -W -f="zlib1g=${Version}\\n" zlib1g
  python -c "import zlib; print(\"python-zlib=available\")"
'
```

The release build and scan commands are:

```bash
docker build --pull -t repopilot:high-fixed .
docker scout cves repopilot:high-fixed
docker scout quickview repopilot:high-fixed
```

Register `/workspace` through the onboarding UI or API to scan the mounted
repository. Stop the disposable container with:

```bash
docker rm -f repopilot-current
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

## Cinematic product film

The self-contained Remotion production lives in `film/`. It is a 58-second,
16:9 product film built from the real RepoPilot workflow: scan, structure,
source intelligence, dependency graph, impact analysis, hotspots, and Git
context. Install and render it offline after dependencies are present:

```bash
npm --prefix film ci
npm --prefix film run typecheck
npm --prefix film run render
```

The finished video is written to `film/out/repopilot-film.mp4`. To preview the
composition in Remotion Studio:

```bash
npm --prefix film run start
```

### Narrated demo status

The checked-in MP4 assets contain video and an audio track, but the current
Remotion composition in `film/src/Root.tsx` does not include an `<Audio>` source
or a recorded narration asset. The audio track is therefore not evidence of a
usable voice-over. Do not overwrite the existing MP4s while fixing this.

To publish the intended narrated demo, preserve the original screen recording,
add the supplied voice recording as a checked-in/private build input (or mux it
at render time), update the composition/render command, render
`film/out/repopilot-film.mp4`, and verify that the exported audio is audible
before updating the README/CDN link. The original voice recording is not
present in this repository, so regeneration cannot be completed from the
current files alone.

## License

See [LICENSE](LICENSE).
