# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1 AS python-deps
WORKDIR /build/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get install --no-install-recommends -y build-essential libffi-dev libssl-dev \
    && python -m pip install --no-cache-dir uv==0.13.1 \
    && uv export --frozen --no-dev --no-emit-project --format requirements-txt --output-file /tmp/requirements.txt \
    && python -m pip install --no-cache-dir --target /opt/python-deps --requirement /tmp/requirements.txt \
    && rm -rf /root/.cache /tmp/requirements.txt /var/lib/apt/lists/*

FROM python:3.12-slim@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1 AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=sqlite:////app/data/repopilot.db \
    PYTHONPATH=/opt/python-deps:/app/backend
WORKDIR /app/backend
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get install --no-install-recommends -y git \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* \
    && python -m pip uninstall -y pip \
    && rm -rf /root/.cache /usr/local/bin/pip /usr/local/bin/pip3 /usr/local/lib/python3.12/site-packages/pip /usr/local/lib/python3.12/site-packages/pip-*.dist-info
RUN useradd --create-home --uid 10001 repopilot \
    && mkdir -p /app/data /app/frontend/dist \
    && chown -R repopilot:repopilot /app
COPY --from=python-deps --chown=repopilot:repopilot /opt/python-deps /opt/python-deps
COPY --chown=repopilot:repopilot backend/app ./app
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
USER repopilot
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:3000/api/v1/health')"
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]
