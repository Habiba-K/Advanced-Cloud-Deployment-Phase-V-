import logging
import os
from datetime import datetime, date, timedelta
from typing import Any, Dict
from uuid import uuid4

import httpx
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, Request
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
DAPR_PUBSUB_NAME = os.getenv("DAPR_PUBSUB_NAME", "kafka-pubsub")
DAPR_STATE_STORE = os.getenv("DAPR_STATE_STORE", "statestore")
BACKEND_APP_ID = os.getenv("BACKEND_APP_ID", "backend")
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"

app = FastAPI(title="Recurring Task Service", version="1.0.0")


class TaskEvent(BaseModel):
    event_id: str
    event_type: str
    task_id: str
    user_id: str
    task_data: Dict[str, Any]
    timestamp: datetime


def calculate_next_occurrence(base_date_str: str, pattern: str, interval: int) -> str:
    """Calculate next occurrence date based on pattern and interval."""
    try:
        base = date.fromisoformat(base_date_str) if base_date_str else date.today()
    except (ValueError, TypeError):
        base = date.today()

    if pattern == "daily":
        next_date = base + timedelta(days=interval)
    elif pattern == "weekly":
        next_date = base + timedelta(weeks=interval)
    elif pattern == "monthly":
        next_date = base + relativedelta(months=interval)
    else:
        return None

    return next_date.isoformat()


@app.get("/dapr/subscribe")
async def subscribe():
    """Return Dapr subscription configuration for the task-events topic."""
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
    Handle incoming task events. When a recurring task is completed,
    auto-create the next occurrence by invoking the backend API via Dapr
    service invocation.
    """
    body = await request.json()
    logger.info(f"Received task event: {body}")

    data = body.get("data", body)

    try:
        event = TaskEvent(**data)
    except Exception as e:
        logger.error(f"Invalid task event payload: {e}")
        return {"status": "DROP"}

    # Only process 'completed' events for recurring tasks
    if event.event_type != "completed":
        logger.info(f"Ignoring non-completion event: {event.event_type}")
        return {"status": "SUCCESS"}

    task_data = event.task_data
    recurrence_pattern = task_data.get("recurrence_pattern", "none")

    if recurrence_pattern == "none":
        logger.info(f"Task {event.task_id} is not recurring, skipping")
        return {"status": "SUCCESS"}

    # Idempotency check
    state_key = f"recurring-processed-{event.event_id}"
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

    # Calculate next occurrence
    interval = task_data.get("recurrence_interval", 1)
    base_date = task_data.get("due_date")
    next_date = calculate_next_occurrence(base_date, recurrence_pattern, interval)

    if not next_date:
        logger.warning(f"Could not calculate next occurrence for task {event.task_id}")
        return {"status": "SUCCESS"}

    # Create new task via Dapr service invocation to backend
    new_task_payload = {
        "title": task_data.get("title", "Recurring Task"),
        "description": task_data.get("description"),
        "priority": task_data.get("priority", "medium"),
        "due_date": next_date,
        "recurrence_pattern": recurrence_pattern,
        "recurrence_interval": interval,
        "tag_ids": [],  # Tags won't carry over automatically
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Use Dapr service invocation to call backend
            url = f"{DAPR_BASE_URL}/v1.0/invoke/{BACKEND_APP_ID}/method/api/{event.user_id}/tasks"
            resp = await client.post(url, json=new_task_payload)
            resp.raise_for_status()
            new_task = resp.json()
            logger.info(
                f"Created next occurrence for recurring task {event.task_id}: "
                f"new_task_id={new_task.get('id')}, due_date={next_date}"
            )
    except Exception as e:
        logger.error(f"Failed to create next occurrence for task {event.task_id}: {e}")
        return {"status": "RETRY"}

    # Mark event as processed
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{DAPR_BASE_URL}/v1.0/state/{DAPR_STATE_STORE}",
                json=[{"key": state_key, "value": {"processed_at": datetime.utcnow().isoformat(), "new_task_id": new_task.get("id")}}],
            )
    except Exception as e:
        logger.warning(f"Failed to save idempotency state: {e}")

    return {"status": "SUCCESS"}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "recurring-task"}
