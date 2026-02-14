from datetime import datetime, date
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel


class TaskStatus(str, Enum):
    """
    Task status enumeration.

    Values:
        PENDING: Task is not yet completed
        COMPLETED: Task has been completed
    """
    PENDING = "pending"
    COMPLETED = "completed"


class TaskPriority(str, Enum):
    """
    Task priority enumeration.

    Values:
        LOW: Low priority task
        MEDIUM: Medium priority task (default)
        HIGH: High priority task
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(SQLModel, table=True):
    """
    Task entity representing a user's task item.

    Attributes:
        id: Unique identifier (UUID)
        user_id: Owner identifier (string, references user)
        title: Task title (required, max 500 chars)
        description: Optional task description
        completed: Completion status (default: False) - DEPRECATED, use status instead
        status: Task status enum (pending/completed, default: pending)
        priority: Task priority enum (low/medium/high, default: medium)
        due_date: Optional due date for the task
        remind_at: Optional reminder datetime (when to send notification)
        completed_at: Optional timestamp when task was marked complete
        created_at: Creation timestamp (UTC)
        updated_at: Last update timestamp (UTC)
    """
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(max_length=255, index=True)
    title: str = Field(max_length=500)
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False)  # DEPRECATED: kept for backward compatibility
    status: TaskStatus = Field(default=TaskStatus.PENDING, sa_column_kwargs={"nullable": False})
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, sa_column_kwargs={"nullable": False})
    due_date: Optional[date] = Field(default=None, index=True)
    remind_at: Optional[datetime] = Field(default=None, index=True)
    completed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
