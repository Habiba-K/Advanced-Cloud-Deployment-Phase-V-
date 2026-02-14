from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.database import init_db
from src.routers import tasks
import os
from dotenv import load_dotenv
import logging

# Import models to ensure SQLModel creates tables
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.audit_log import AuditLog

# Import MCP server
from src.mcp import mcp_server

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
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


# Include routers
from src.routers import auth, tags, dapr, audit
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(tags.router, prefix="/api", tags=["tags"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(dapr.router, tags=["dapr"])

from src.routers import chat
app.include_router(chat.router, prefix="/api", tags=["chat"])
