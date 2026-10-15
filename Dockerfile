FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=sqlite:////app/data/repopilot.db
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN apt-get update \
    && apt-get install --no-install-recommends -y git \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv==0.13.1 \
    && uv sync --directory backend --frozen --no-dev
COPY backend/app ./backend/app
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
RUN useradd --create-home --uid 10001 repopilot && mkdir -p /app/data && chown -R repopilot:repopilot /app
USER repopilot
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:3000/api/v1/health')"
CMD ["uv", "run", "--directory", "backend", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]
