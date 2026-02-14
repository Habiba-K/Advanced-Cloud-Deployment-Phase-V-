import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Set

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
DAPR_PUBSUB_NAME = os.getenv("DAPR_PUBSUB_NAME", "kafka-pubsub")
DAPR_BASE_URL = f"http://localhost:{DAPR_HTTP_PORT}"

app = FastAPI(title="WebSocket Service", version="1.0.0")


class ConnectionManager:
    """Manages WebSocket connections grouped by user_id."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected")

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            dead_connections = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_connections.add(ws)
            # Clean up dead connections
            for ws in dead_connections:
                self.active_connections[user_id].discard(ws)

    async def broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)


manager = ConnectionManager()


class TaskUpdateEvent(BaseModel):
    event_id: str
    event_type: str
    task_id: str
    user_id: str
    task_data: Dict[str, Any]
    timestamp: datetime


@app.get("/dapr/subscribe")
async def subscribe():
    return [
        {
            "pubsubname": DAPR_PUBSUB_NAME,
            "topic": "task-updates",
            "route": "/task-updates",
        }
    ]


@app.post("/task-updates")
async def handle_task_update(request: Request):
    """
    Receive task update events from Dapr pub/sub and broadcast
    to connected WebSocket clients for that user.
    """
    body = await request.json()
    logger.info(f"Received task update event: {body}")

    data = body.get("data", body)

    try:
        event = TaskUpdateEvent(**data)
    except Exception as e:
        logger.error(f"Invalid task update payload: {e}")
        return {"status": "DROP"}

    # Send to the specific user's connected clients
    await manager.send_to_user(event.user_id, {
        "type": event.event_type,
        "task_id": event.task_id,
        "task_data": event.task_data,
        "timestamp": event.timestamp.isoformat(),
    })

    logger.info(f"Broadcasted {event.event_type} event for task {event.task_id} to user {event.user_id}")
    return {"status": "SUCCESS"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time task updates.
    Clients connect with their user_id and receive live task changes.
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)


@app.get("/health")
async def health():
    total_connections = sum(len(conns) for conns in manager.active_connections.values())
    return {
        "status": "healthy",
        "service": "websocket",
        "active_users": len(manager.active_connections),
        "total_connections": total_connections,
    }
