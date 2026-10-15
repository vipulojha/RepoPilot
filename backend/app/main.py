import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.health import router as health_router
from app.api.v1.files import router as files_router
from app.api.v1.router import router as repository_router
from app.api.v1.scans import router as scans_router
from app.api.v1.symbols import file_symbols_router, router as symbols_router
from app.api.v1.dependencies import router as dependencies_router
from app.api.v1.search import router as search_router
from app.api.v1.impact import router as impact_router
from app.api.v1.graph import router as graph_router
from app.api.v1.hotspots import router as hotspots_router
from app.api.v1.test_relationships import router as test_relationships_router
from app.config import get_settings
from app.db.database import init_db

settings = get_settings()
logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("repopilot")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    logger.info("RepoPilot started")
    yield
    logger.info("RepoPilot stopped")


app = FastAPI(title="RepoPilot API", version=settings.app_version, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    response = await call_next(request)
    logger.info("%s %s %s", request.method, request.url.path, response.status_code)
    return response


@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception):
    logger.exception("Unhandled application error: %s", exc)
    return JSONResponse(status_code=500, content={"error": {"code": "internal_error", "message": "Internal server error"}})


app.include_router(health_router, prefix="/api/v1")
app.include_router(repository_router, prefix="/api/v1")
app.include_router(scans_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(symbols_router, prefix="/api/v1")
app.include_router(file_symbols_router, prefix="/api/v1")
app.include_router(dependencies_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(impact_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")
app.include_router(hotspots_router, prefix="/api/v1")
app.include_router(test_relationships_router, prefix="/api/v1")

frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        requested = frontend_dist / path
        if path and requested.is_file() and frontend_dist in requested.resolve().parents:
            return FileResponse(requested)
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port)
