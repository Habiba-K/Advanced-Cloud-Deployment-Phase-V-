import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from fastapi import FastAPI, Request
from pydantic import BaseModel

from sqlmodel import SQLModel, Field, Column, create_engine
from sqlalchemy import JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
DAPR_PUBSUB_NAME = os.getenv("DAPR_PUBSUB_NAME", "kafka-pubsub")
DATABASE_URL = os.getenv("DATABASE_URL", "")
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"

app = FastAPI(title="Audit Service", version="1.0.0")


# ---- Database Model ----
class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(max_length=255, index=True)
    event_type: str = Field(max_length=50)
    task_id: UUID
    task_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    event_id: str = Field(max_length=255, unique=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


# ---- Event Schema ----
class TaskEvent(BaseModel):
    event_id: str
    event_type: str
    task_id: str
    user_id: str
    task_data: Dict[str, Any]
    timestamp: datetime


# ---- Database Setup ----
engine = None
async_session = None


@app.on_event("startup")
async def startup():
    global engine, async_session
    if DATABASE_URL:
        db_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        engine = create_async_engine(db_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Audit database initialized")
    else:
        logger.warning("DATABASE_URL not set, audit logs will not be persisted")


@app.get("/dapr/subscribe")
async def subscribe():
    return [
        {
            "pubsubname": DAPR_PUBSUB_NAME,
            "topic": "task-events",
            "route": "/task-events",
        }
    ]


@app.post("/task-events")
async def handle_task_event(request: Request):
    """
    Handle incoming task events and store them in the audit_log table.
    Uses event_id for idempotent processing (unique constraint).
    """
    body = await request.json()
    logger.info(f"Received task event for audit: {body}")

    data = body.get("data", body)

    try:
        event = TaskEvent(**data)
    except Exception as e:
        logger.error(f"Invalid task event payload: {e}")
        return {"status": "DROP"}

    if not async_session:
        logger.warning("No database connection, cannot store audit log")
        return {"status": "SUCCESS"}

    try:
        async with async_session() as session:
            # Check idempotency via unique event_id
            from sqlalchemy import select
            existing = await session.execute(
                select(AuditLog).where(AuditLog.event_id == event.event_id)
            )
            if existing.scalar_one_or_none():
                logger.info(f"Duplicate audit event {event.event_id}, skipping")
                return {"status": "SUCCESS"}

            audit_entry = AuditLog(
                user_id=event.user_id,
                event_type=event.event_type,
                task_id=UUID(event.task_id),
                task_data=event.task_data,
                event_id=event.event_id,
                timestamp=event.timestamp,
            )
            session.add(audit_entry)
            await session.commit()
            logger.info(f"Stored audit log: event_id={event.event_id}, type={event.event_type}")
    except Exception as e:
        logger.error(f"Failed to store audit log: {e}")
        return {"status": "RETRY"}

    return {"status": "SUCCESS"}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "audit"}
