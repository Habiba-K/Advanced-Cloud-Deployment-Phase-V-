from fastapi import APIRouter, Request, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from src.database import get_session
from src.models.task import Task
from src.services.event_publisher import publish_reminder_event
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dapr/subscribe")
async def get_subscriptions():
    """
    Dapr subscription endpoint.
    Returns list of pub/sub subscriptions for this service.

    For the backend API service, we don't subscribe to any topics.
    Subscriptions are handled by dedicated microservices (notification, recurring-task, audit, websocket).

    Returns:
        Empty list (backend doesn't consume events, only publishes)
    """
    return []


@router.post("/reminder-cron")
async def reminder_cron_handler(request: Request, db: AsyncSession = Depends(get_session)):
    """
    Dapr cron binding handler.
    Triggered every 5 minutes to check for upcoming task reminders.

    This endpoint:
    1. Queries tasks with remind_at in the next 10 minutes
    2. Publishes ReminderEvent for each task
    3. Updates task to prevent duplicate reminders

    Args:
        request: FastAPI request object
        db: Database session (injected)

    Returns:
        Success message with count of reminders sent
    """
    try:
        logger.info("Reminder cron job triggered")

        # Calculate time window: now to 10 minutes from now
        now = datetime.utcnow()
        window_end = now + timedelta(minutes=10)

        # Query tasks with remind_at in the window and not yet completed
        result = await db.execute(
            select(Task).where(
                and_(
                    Task.remind_at.isnot(None),
                    Task.remind_at >= now,
                    Task.remind_at <= window_end,
                    Task.completed == False
                )
            )
        )
        tasks = result.scalars().all()

        reminder_count = 0
        for task in tasks:
            try:
                # Publish reminder event
                await publish_reminder_event(task, task.user_id)
                reminder_count += 1
                logger.info(f"Published reminder for task {task.id}, user {task.user_id}")

                # Update remind_at to prevent duplicate reminders
                # Set it to None or to a future time if recurring
                task.remind_at = None
                await db.commit()

            except Exception as e:
                logger.error(f"Failed to publish reminder for task {task.id}: {str(e)}")
                # Continue with other tasks even if one fails

        logger.info(f"Reminder cron job completed: {reminder_count} reminders sent")

        return {
            "status": "success",
            "reminders_sent": reminder_count,
            "timestamp": now.isoformat()
        }

    except Exception as e:
        logger.error(f"Reminder cron job failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cron job failed: {str(e)}")

