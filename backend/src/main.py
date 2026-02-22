from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.database import init_db, get_session
from src.routers import tasks
import os
from dotenv import load_dotenv
import logging
import uuid
import time
from datetime import datetime
from sqlmodel import select

# Import models to ensure SQLModel creates tables
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.audit_log import AuditLog

# Import MCP server
from src.mcp import mcp_server

load_dotenv()

# Configure structured logging with JSON format
# Use a custom filter to provide default correlation_id
class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'correlation_id'):
            record.correlation_id = 'N/A'
        return True

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s", "correlation_id": "%(correlation_id)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S'
)

# Add filter to root logger
for handler in logging.root.handlers:
    handler.addFilter(CorrelationIdFilter())

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Task Management API with AI Chat Agent",
    description="REST API for task management with JWT authentication, MCP server, and Groq AI agent",
    version="1.0.0",
)

# CORS configuration with environment variable
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Correlation ID Middleware
@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    """Add correlation ID to each request for distributed tracing."""
    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))

    # Store correlation ID in request state
    request.state.correlation_id = correlation_id

    # Add to logging context
    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.correlation_id = correlation_id
        return record

    logging.setLogRecordFactory(record_factory)

    # Track request timing
    start_time = time.time()

    try:
        response = await call_next(request)

        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id

        # Log request completion
        duration = time.time() - start_time
        logger.info(
            f"Request completed: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.3f}s",
            extra={"correlation_id": correlation_id}
        )

        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} - Error: {str(e)} - Duration: {duration:.3f}s",
            extra={"correlation_id": correlation_id}
        )
        raise
    finally:
        logging.setLogRecordFactory(old_factory)


# Custom Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with standardized error format."""
    error_code_map = {
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_ERROR"
    }

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": error_code_map.get(exc.status_code, "ERROR"),
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "status_code": 500
        }
    )


@app.on_event("startup")
async def startup_event():
    """
    Initialize database tables and MCP server on application startup.
    """
    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Initialize MCP server
    await mcp_server.startup()
    logger.info(f"MCP Server started with {len(mcp_server.tools)} tools")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup MCP server on application shutdown.
    """
    await mcp_server.shutdown()
    logger.info("MCP Server shutdown complete")


@app.get("/")
async def root():
    """
    Root endpoint - API health check.
    """
    return {
        "message": "Task Management API with Authentication",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """
    Basic health check endpoint for load balancers and orchestrators.
    Returns 200 if the service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "task-api"
    }


@app.get("/health/ready")
async def readiness_check():
    """
    Readiness check - verifies all dependencies are available.
    Used by Kubernetes to determine if the pod can receive traffic.
    """
    checks = {
        "database": "unknown",
        "mcp_server": "unknown"
    }

    overall_status = "ready"

    # Check database connectivity
    try:
        async with get_session() as session:
            # Simple query to verify database connection
            result = await session.execute(select(1))
            result.scalar()
            checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        overall_status = "not_ready"
        logger.error(f"Database health check failed: {str(e)}", extra={"correlation_id": "health-check"})

    # Check MCP server status
    try:
        if mcp_server and len(mcp_server.tools) > 0:
            checks["mcp_server"] = "healthy"
        else:
            checks["mcp_server"] = "unhealthy: no tools loaded"
            overall_status = "not_ready"
    except Exception as e:
        checks["mcp_server"] = f"unhealthy: {str(e)}"
        overall_status = "not_ready"
        logger.error(f"MCP server health check failed: {str(e)}", extra={"correlation_id": "health-check"})

    status_code = 200 if overall_status == "ready" else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": checks
        }
    )


@app.get("/health/live")
async def liveness_check():
    """
    Liveness check - verifies the service is alive and not deadlocked.
    Used by Kubernetes to determine if the pod should be restarted.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


# Include routers
from src.routers import auth, tags, dapr, audit
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(tags.router, prefix="/api", tags=["tags"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(dapr.router, tags=["dapr"])

from src.routers import chat
app.include_router(chat.router, prefix="/api", tags=["chat"])
