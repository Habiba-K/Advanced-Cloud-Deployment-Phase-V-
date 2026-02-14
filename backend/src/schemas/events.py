from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class TaskEvent(BaseModel):
    """
    Event schema for task lifecycle events published to 'task-events' topic.

    Attributes:
        event_id: Unique event identifier (UUID string)
        event_type: Type of event (created, updated, completed, deleted)
        task_id: Task identifier (UUID string)
        user_id: User who performed the action
        task_data: Full task object snapshot at event time
        timestamp: When the event occurred (ISO-8601 datetime)
    """
    event_id: str = Field(..., description="Unique event identifier")
    event_type: str = Field(..., description="Event type: created, updated, completed, deleted")
    task_id: str = Field(..., description="Task UUID")
    user_id: str = Field(..., description="User identifier")
    task_data: Dict[str, Any] = Field(..., description="Full task snapshot")
    timestamp: datetime = Field(..., description="Event timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "event_type": "created",
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "user123",
                "task_data": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "title": "Complete project",
                    "description": "Finish the implementation",
                    "status": "pending",
                    "priority": "high",
                    "due_date": "2026-02-15",
                    "recurrence_pattern": "none",
                    "recurrence_interval": 1,
                    "tags": ["work", "urgent"]
                },
                "timestamp": "2026-02-09T10:30:00Z"
            }
        }


class ReminderEvent(BaseModel):
    """
    Event schema for reminder notifications published to 'reminders' topic.

    Attributes:
        event_id: Unique event identifier (UUID string)
        task_id: Task identifier (UUID string)
        user_id: User to notify
        title: Task title for notification
        due_at: When the task is due (ISO-8601 datetime)
        remind_at: When to send the reminder (ISO-8601 datetime)
        timestamp: When the event was created (ISO-8601 datetime)
    """
    event_id: str = Field(..., description="Unique event identifier")
    task_id: str = Field(..., description="Task UUID")
    user_id: str = Field(..., description="User identifier")
    title: str = Field(..., description="Task title")
    due_at: datetime = Field(..., description="Task due date/time")
    remind_at: datetime = Field(..., description="When to send reminder")
    timestamp: datetime = Field(..., description="Event timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440001",
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "user123",
                "title": "Complete project",
                "due_at": "2026-02-15T17:00:00Z",
                "remind_at": "2026-02-15T16:00:00Z",
                "timestamp": "2026-02-09T10:30:00Z"
            }
        }


class TaskUpdateEvent(BaseModel):
    """
    Event schema for real-time task updates published to 'task-updates' topic.
    Used for broadcasting changes to all connected clients via WebSocket.

    Attributes:
        event_id: Unique event identifier (UUID string)
        event_type: Type of update (created, updated, completed, deleted)
        task_id: Task identifier (UUID string)
        user_id: User who performed the action
        task_data: Full task object snapshot at event time
        timestamp: When the event occurred (ISO-8601 datetime)
    """
    event_id: str = Field(..., description="Unique event identifier")
    event_type: str = Field(..., description="Event type: created, updated, completed, deleted")
    task_id: str = Field(..., description="Task UUID")
    user_id: str = Field(..., description="User identifier")
    task_data: Dict[str, Any] = Field(..., description="Full task snapshot")
    timestamp: datetime = Field(..., description="Event timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440002",
                "event_type": "updated",
                "task_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "user123",
                "task_data": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "title": "Complete project - Updated",
                    "description": "Finish the implementation with tests",
                    "status": "pending",
                    "priority": "high",
                    "due_date": "2026-02-15",
                    "recurrence_pattern": "none",
                    "recurrence_interval": 1,
                    "tags": ["work", "urgent"]
                },
                "timestamp": "2026-02-09T11:00:00Z"
            }
        }
