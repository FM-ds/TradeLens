from fastapi import FastAPI, Request
import logging
import time
import sys

from fastapi.middleware.cors import CORSMiddleware

from tradelens.baci_service import router as baci_router # further sorting of routers required
from tradelens.common_service import router as common_router
from tradelens.prodcom_service import router as prodcom_router
from tradelens.embedding import load_embeddings_data, setup_embeddings


def configure_application_logging() -> None:
    """Configure terminal-visible logging for the tradelens logger namespace."""
    app_logger = logging.getLogger("tradelens")
    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False

    # Always keep a direct terminal handler so app logs never disappear.
    if not app_logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        ))
        app_logger.addHandler(handler)
        app_logger.info("Tradelens logger initialized with terminal handler")

    # Also attach uvicorn's error handlers when available.
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    for handler in uvicorn_error_logger.handlers:
        if handler not in app_logger.handlers:
            app_logger.addHandler(handler)


async def request_logging_middleware(request: Request, call_next):
    """Emit one line per request using the tradelens logger namespace."""
    start_time = time.perf_counter()
    req_logger = logging.getLogger("tradelens.request")
    
    # Log every incoming request with full URL and query params
    req_logger.info(
        "INCOMING %s %s?%s from %s",
        request.method,
        request.url.path,
        request.url.query,
        request.client.host if request.client else "unknown",
    )
    
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    
    req_logger.info(
        "OUTGOING %s %s -> %d (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


def get_app():
    """Prepare the FastAPI app object"""
    app = FastAPI()
    configure_application_logging()
    app.middleware("http")(request_logging_middleware)

    embeddings_data = load_embeddings_data()
    embedding_model, embedding_matrices = setup_embeddings(embeddings_data)

    app.state.embeddings_data = embeddings_data
    app.state.embedding_model = embedding_model
    app.state.embedding_matrices = embedding_matrices

    app.include_router(baci_router)
    app.include_router(common_router)
    app.include_router(prodcom_router)

    # Add Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app
