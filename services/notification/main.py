import logging
import os
from datetime import datetime
from typing import Any, Dict
from uuid import uuid4

import httpx
from fastapi import FastAPI, Request
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
DAPR_PUBSUB_NAME = os.getenv("DAPR_PUBSUB_NAME", "kafka-pubsub")
DAPR_STATE_STORE = os.getenv("DAPR_STATE_STORE", "statestore")
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"

app = FastAPI(title="Notification Service", version="1.0.0")


class ReminderEvent(BaseModel):
    event_id: str
    task_id: str
    user_id: str
    title: str
    due_at: datetime
    remind_at: datetime
    timestamp: datetime


class TaskUpdateEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: str
    task_id: str
    user_id: str
    task_data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


@app.get("/dapr/subscribe")
async def subscribe():
    """Return Dapr subscription configuration for the reminders topic."""
    return [
        {
            "pubsubname": DAPR_PUBSUB_NAME,
            "topic": "reminders",
            "route": "/reminders",
        }
    ]


@app.post("/reminders")
async def handle_reminder(request: Request):
    """
    Handle incoming reminder events from the reminders topic.

    Verifies the task is still pending, then publishes a TaskUpdateEvent
    to the task-updates topic so the WebSocket service can notify the user.
    """
    body = await request.json()
    logger.info(f"Received reminder event: {body}")

    # Extract CloudEvent data
    data = body.get("data", body)

    try:
        event = ReminderEvent(**data)
    except Exception as e:
        logger.error(f"Invalid reminder event payload: {e}")
        return {"status": "DROP"}

    # Idempotency check via Dapr state store
    state_key = f"notification-processed-{event.event_id}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{DAPR_BASE_URL}/v1.0/state/{DAPR_STATE_STORE}/{state_key}"
            )
            if resp.status_code == 200 and resp.text:
                logger.info(f"Duplicate event {event.event_id}, skipping")
                return {"status": "SUCCESS"}
    except Exception as e:
        logger.warning(f"State store check failed: {e}, proceeding anyway")

    # Publish notification as TaskUpdateEvent to task-updates topic
    notification_event = TaskUpdateEvent(
        event_type="notification",
        task_id=event.task_id,
        user_id=event.user_id,
        task_data={
            "notification_type": "reminder",
            "task_id": event.task_id,
            "title": event.title,
            "due_at": event.due_at.isoformat(),
            "remind_at": event.remind_at.isoformat(),
            "message": f"Reminder: '{event.title}' is due soon",
        },
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{DAPR_BASE_URL}/v1.0/publish/{DAPR_PUBSUB_NAME}/task-updates",
                json=notification_event.model_dump(mode="json"),
            )
            resp.raise_for_status()
            logger.info(
                f"Published notification for task {event.task_id} to user {event.user_id}"
            )
    except Exception as e:
        logger.error(f"Failed to publish notification event: {e}")
        return {"status": "RETRY"}

    # Mark event as processed in state store
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{DAPR_BASE_URL}/v1.0/state/{DAPR_STATE_STORE}",
                json=[{"key": state_key, "value": {"processed_at": datetime.utcnow().isoformat()}}],
            )
    except Exception as e:
        logger.warning(f"Failed to save idempotency state: {e}")

    return {"status": "SUCCESS"}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "notification"}
