.PHONY: setup test frontend-check backend-check

setup:
	uv sync --directory backend --dev
	npm --prefix frontend ci

backend-check:
	uv run --directory backend python -m compileall app
	uv run --directory backend pytest

frontend-check:
	npm --prefix frontend run typecheck
	npm --prefix frontend run build

test: backend-check frontend-check
