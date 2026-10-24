# backend/core/middleware.py
"""Request tracing, structured logging, and standardized error response middleware."""
import time
import uuid
import logging
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.core.errors import PlatformException

logger = logging.getLogger("techzone.platform")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Extracts or injects a unique X-Request-ID header.
    2. Measures request execution duration.
    3. Emits structured log entries.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = request_id

        start_time = time.time()
        tenant_id = request.headers.get("x-tenant-id") or request.query_params.get("tenant_id") or "unscoped"

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        logger.info(
            f"request_id={request_id} tenant_id={tenant_id} "
            f"method={request.method} path={request.url.path} "
            f"status={response.status_code} latency_ms={duration_ms}"
        )
        return response


def register_error_handlers(app: FastAPI) -> None:
    """Registers unified error response handlers adhering to the SaaS API contract."""

    @app.exception_handler(PlatformException)
    async def platform_exception_handler(request: Request, exc: PlatformException):
        request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": request_id,
                }
            },
            headers={"X-Request-ID": request_id},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
        formatted_details = []
        for error in exc.errors():
            loc = ".".join([str(x) for x in error.get("loc", []) if x != "body"])
            formatted_details.append({
                "field": loc or None,
                "message": error.get("msg", "Invalid parameter"),
                "code": error.get("type", "value_error"),
            })
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "One or more input fields failed validation.",
                    "details": formatted_details,
                    "request_id": request_id,
                }
            },
            headers={"X-Request-ID": request_id},
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            500: "INTERNAL_SERVER_ERROR",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": str(exc.detail) if exc.detail else "An HTTP error occurred.",
                "error": {
                    "code": code,
                    "message": str(exc.detail) if exc.detail else "An HTTP error occurred.",
                    "details": [],
                    "request_id": request_id,
                }
            },
            headers={"X-Request-ID": request_id},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
        logger.exception(f"Unhandled exception on request {request_id}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred. Please contact support.",
                    "details": [],
                    "request_id": request_id,
                }
            },
            headers={"X-Request-ID": request_id},
        )
