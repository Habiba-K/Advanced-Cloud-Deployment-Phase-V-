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


class RecurrencePattern(str, Enum):
    """
    Recurrence pattern enumeration.

    Values:
        NONE: No recurrence (one-time task)
        DAILY: Repeats every N days
        WEEKLY: Repeats every N weeks
        MONTHLY: Repeats every N months
    """
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


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
        recurrence_pattern: Recurrence pattern (none/daily/weekly/monthly, default: none)
        recurrence_interval: Interval for recurrence (e.g., every 2 weeks), default 1
        next_occurrence: Calculated next occurrence date for recurring tasks
        completed_at: Optional timestamp when task was marked complete
        deleted_at: Optional timestamp for soft delete
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
    recurrence_pattern: RecurrencePattern = Field(default=RecurrencePattern.NONE, sa_column_kwargs={"nullable": False})
    recurrence_interval: Optional[int] = Field(default=1)
    next_occurrence: Optional[date] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
