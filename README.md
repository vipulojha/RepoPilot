# RepoPilot — Repository Intelligence & Dependency Explorer

RepoPilot will be a self-hosted application for exploring repositories, understanding their structure, and analyzing relationships between files, symbols, and dependencies. This repository currently contains only the initial project structure; application implementation will be added in future work.

## Current status

**Project initialization**

## Planned capabilities

- Repository scanning
- File and language statistics
- Dependency analysis
- Interactive dependency graph
- Code and symbol search
- Change-impact analysis
- Polished web interface
- Docker-based deployment

The application will be Dockerized and designed to run on a clean Linux environment.

## Architecture

The Phase 1 design is documented in:

- [Architecture](docs/architecture.md)
- [REST API design](docs/api-design.md)
- [UI/UX design](docs/ui-design.md)

Implementation has not started. The planned stack is a React + TypeScript +
Vite frontend, a Python 3.12 + FastAPI backend, Tree-sitter analysis, SQLite
with FTS5 search, and a single Docker deployment.

## Current foundation

The frontend visual prototype is complete. The backend now provides the
minimal FastAPI, SQLite, configuration, logging, and repository metadata API
foundation. Repository scanning, parsing, dependency analysis, search
indexing, and impact analysis are not implemented yet.

### Prerequisites

- Node.js 22 (`.nvmrc`)
- Python 3.12 (`backend/.python-version`)
- `uv` for reproducible Python dependency installation
- Docker for the container workflow

### Local development

```bash
# frontend
cd frontend
npm ci
npm run dev

# backend, in another terminal
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The health endpoint is `GET http://127.0.0.1:8000/api/v1/health`. Copy
`.env.example` to `.env` when local configuration is needed. The frontend uses
`VITE_API_BASE_URL` for its single API client.

### Tests and builds

```bash
cd backend && uv run pytest
cd frontend && npm run typecheck && npm run build
```

### Docker

```bash
docker build -t repopilot .
docker run --rm -p 3000:3000 repopilot
```

The container serves the built frontend and FastAPI health/API foundation. It
does not analyze repositories yet.

## Repository scanner foundation

Register a repository through `POST /api/v1/repositories`, then start a scan with `POST /api/v1/repositories/{id}/scans`. Poll the scan detail route until its status is `ready`, then use the files and tree routes. Scans store relative POSIX paths and never follow symlinks outside the registered root.

The scanner excludes `.git/`, common dependency/build/cache directories, and repository `.gitignore` entries. Binary and oversized files are recorded with metadata without being decoded as source. A failed scan remains isolated from the previous READY snapshot.

Phase 3A adds syntax-only Tree-sitter symbol extraction for Python, JavaScript/JSX, TypeScript/TSX, and Java. Symbols are persisted per READY snapshot with source locations and parent relationships. Imports, dependency analysis, search indexing, graphs, and impact analysis are not implemented.

Phase 3B adds snapshot-scoped dependency intelligence. Supported imports from Python, JavaScript/JSX, TypeScript/TSX, and Java are classified as internal, external, or unresolved and exposed through forward/reverse dependency APIs. Search, graph UI, impact analysis, hotspots, test relationships, and AI are not implemented.

Phase 3C adds snapshot-isolated SQLite FTS5 search for files, paths, symbols, and source text. Search is available through the repository search API and the existing Search screen. Graph UI, impact analysis, hotspots, test relationships, and AI remain unimplemented.

Phase 3D adds deterministic reverse-dependency impact analysis through a real API and the existing Impact Analysis screen. It uses READY snapshots and internal dependency evidence only. Graph visualization, hotspots, test relationship analysis, and AI remain unimplemented.

Phase 3E adds the real bounded Dependency Graph screen using React Flow. It projects existing dependency records only, preserves A → B direction, supports incoming/outgoing/both direction, depth and limits, and keeps Signal Map styling.

Phase 3F adds deterministic, explainable repository hotspots based on static file, symbol, dependency, and bounded impact signals. Historical Git churn, test relationships, and AI are not used.

Phase 3G adds deterministic static test relationships using existing test classification and dependency records. The Tests screen shows evidence level and explicitly does not execute tests or report runtime coverage.

## Phase 4B repository overview

The Dashboard now reads one selected repository and latest READY snapshot through the aggregate overview API. Statistics come from existing files, symbols, internal dependencies, test flags, scan warnings, language counts, and hotspot intelligence.

## Phase 4D cross-feature navigation

The shell carries selected repository and file IDs across Search, Files, File Detail, Graph, Impact, Hotspots, and Tests. Entity actions open the File Intelligence Hub and preserve repository context; existing APIs remain the intelligence source.

## Phase 4E source viewer

The bounded READY-only content endpoint remains the source boundary. The File Hub now renders stable line numbers and keyboard-readable source rows, while binary/skipped/unreadable states remain explicit. No editor or repository code execution is introduced.

## Phase 4F quality pass

The workspace quality pass adds visible focus states, compact responsive behavior, bounded source rendering, and consistent empty/error messaging. Command palette and repository controls remain keyboard reachable.
