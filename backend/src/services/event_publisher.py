import logging
from datetime import datetime
from uuid import uuid4
from typing import Dict, Any
from src.models.task import Task
from src.schemas.events import TaskEvent, ReminderEvent, TaskUpdateEvent
from src.services.dapr_client import dapr_client
from src.config import settings

logger = logging.getLogger(__name__)


def _task_to_dict(task: Task) -> Dict[str, Any]:
    """
    Convert Task model to dictionary for event payload.

    Args:
        task: Task model instance

    Returns:
        Dictionary representation of task with all fields
    """
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "status": "completed" if task.completed else "pending",
        "priority": getattr(task, "priority", "medium"),
        "due_date": task.due_date.isoformat() if hasattr(task, "due_date") and task.due_date else None,
        "recurrence_pattern": getattr(task, "recurrence_pattern", "none"),
        "recurrence_interval": getattr(task, "recurrence_interval", 1),
        "tags": getattr(task, "tags", []),
        "completed": task.completed,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat()
    }


async def publish_task_event(
    event_type: str,
    task: Task,
    user_id: str
) -> None:
    """
    Publish a task lifecycle event to the 'task-events' topic.

    This event is consumed by:
    - Recurring Task Service (for auto-creating next occurrence)
    - Audit Service (for maintaining activity history)

    Args:
        event_type: Type of event (created, updated, completed, deleted)
        task: Task model instance
        user_id: User who performed the action

    Raises:
        Exception: If publishing fails after all retries
    """
    event_id = str(uuid4())

    event = TaskEvent(
        event_id=event_id,
        event_type=event_type,
        task_id=str(task.id),
        user_id=user_id,
        task_data=_task_to_dict(task),
        timestamp=datetime.utcnow()
    )

    try:
        await dapr_client.publish_event(
            pubsubname=settings.dapr_pubsub_name,
            topic="task-events",
            data=event.model_dump(mode='json')
        )
        logger.info(
            f"Published task event: type={event_type}, task_id={task.id}, "
            f"event_id={event_id}, user_id={user_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to publish task event: type={event_type}, task_id={task.id}, "
            f"error={str(e)}"
        )
        raise


async def publish_reminder_event(
    task: Task,
    user_id: str
) -> None:
    """
    Publish a reminder event to the 'reminders' topic.

    This event is consumed by:
    - Notification Service (for sending reminders at the scheduled time)

    Args:
        task: Task model instance with due_date and remind_at set
        user_id: User to notify

    Raises:
        ValueError: If task doesn't have due_date or remind_at set
        Exception: If publishing fails after all retries
    """
    if not hasattr(task, "due_date") or not task.due_date:
        raise ValueError("Task must have due_date set to publish reminder event")

    if not hasattr(task, "remind_at") or not task.remind_at:
        raise ValueError("Task must have remind_at set to publish reminder event")

    event_id = str(uuid4())

    event = ReminderEvent(
        event_id=event_id,
        task_id=str(task.id),
        user_id=user_id,
        title=task.title,
        due_at=task.due_date if isinstance(task.due_date, datetime) else datetime.combine(task.due_date, datetime.min.time()),
        remind_at=task.remind_at,
        timestamp=datetime.utcnow()
    )

    try:
        await dapr_client.publish_event(
            pubsubname=settings.dapr_pubsub_name,
            topic="reminders",
            data=event.model_dump(mode='json')
        )
        logger.info(
            f"Published reminder event: task_id={task.id}, event_id={event_id}, "
            f"user_id={user_id}, remind_at={task.remind_at}"
        )
    except Exception as e:
        logger.error(
            f"Failed to publish reminder event: task_id={task.id}, error={str(e)}"
        )
        raise


async def publish_task_update_event(
    event_type: str,
    task: Task,
    user_id: str
) -> None:
    """
    Publish a task update event to the 'task-updates' topic.

    This event is consumed by:
    - WebSocket Service (for broadcasting real-time updates to all connected clients)

    Args:
        event_type: Type of update (created, updated, completed, deleted)
        task: Task model instance
        user_id: User who performed the action

    Raises:
        Exception: If publishing fails after all retries
    """
    event_id = str(uuid4())

    event = TaskUpdateEvent(
        event_id=event_id,
        event_type=event_type,
        task_id=str(task.id),
        user_id=user_id,
        task_data=_task_to_dict(task),
        timestamp=datetime.utcnow()
    )

    try:
        await dapr_client.publish_event(
            pubsubname=settings.dapr_pubsub_name,
            topic="task-updates",
            data=event.model_dump(mode='json')
        )
        logger.info(
            f"Published task update event: type={event_type}, task_id={task.id}, "
            f"event_id={event_id}, user_id={user_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to publish task update event: type={event_type}, task_id={task.id}, "
            f"error={str(e)}"
        )
        raise
