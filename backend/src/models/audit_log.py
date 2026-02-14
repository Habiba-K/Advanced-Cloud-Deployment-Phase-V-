from datetime import datetime
from typing import Optional, Any
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON


class AuditLog(SQLModel, table=True):
    """
    Audit log entity for tracking all task lifecycle events.

    Attributes:
        id: Unique identifier (UUID)
        user_id: User who performed the action
        event_type: Type of event (created, updated, completed, deleted)
        task_id: Reference to the task (not a foreign key since task may be deleted)
        task_data: Full task snapshot at event time (JSONB)
        event_id: Kafka message ID for idempotency (unique)
        timestamp: When the event occurred
    """
    __tablename__ = "audit_log"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(max_length=255, index=True)
    event_type: str = Field(max_length=50)
    task_id: UUID
    task_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    event_id: str = Field(max_length=255, unique=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
