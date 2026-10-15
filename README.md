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
