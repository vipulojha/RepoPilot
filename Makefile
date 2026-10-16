.PHONY: setup test frontend-check backend-check film-check

setup:
	uv sync --directory backend --dev
	npm --prefix frontend ci
	npm --prefix film ci

backend-check:
	uv run --directory backend python -m compileall app
	uv run --directory backend pytest

frontend-check:
	npm --prefix frontend run typecheck
	npm --prefix frontend run build

film-check:
	npm --prefix film run typecheck

test: backend-check frontend-check film-check
