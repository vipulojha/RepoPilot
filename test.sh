#!/bin/sh
set -eu

echo "== backend compile =="
uv run --directory backend python -m compileall app

echo "== backend tests =="
uv run --directory backend pytest

echo "== frontend typecheck =="
npm --prefix frontend run typecheck

echo "== frontend build =="
npm --prefix frontend run build

echo "== film typecheck =="
npm --prefix film run typecheck
