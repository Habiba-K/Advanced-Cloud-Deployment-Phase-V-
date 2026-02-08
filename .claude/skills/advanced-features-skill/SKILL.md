---
name: advanced-features-skill
description: Implement advanced and intermediate task features (recurring tasks, reminders, priorities, tags, search, filter, sort) using FastAPI, React/Next.js, and Dapr + Kafka for event-driven architecture. Use when expanding the Todo app with scalable and event-driven functionality.
---

# Advanced Features Skill

## Instructions
Implement advanced features in the Todo app with the following:

1. **Intermediate Features**
   - Priority: High / Medium / Low
   - Tags: Work / Home / Personal
   - Search, Filter, Sort tasks by title, date, or priority
   - Frontend forms and UI updates for feature visibility
   - Ensure proper Pydantic validation and state management

2. **Advanced Features**
   - Recurring tasks (daily, weekly, monthly)
   - Due dates and scheduled reminders
   - Event-driven backend updates via Kafka topics: `task-events`, `reminders`, `task-updates`
   - Audit logs and real-time task synchronization across clients

3. **Event Streaming & Dapr Integration**
   - Use Dapr Pub/Sub instead of direct Kafka clients
   - Store task states and conversation history using Dapr State Store
   - Trigger scheduled reminders with Dapr Cron Bindings
   - Manage API keys and DB credentials via Dapr Secrets Management

4. **Infrastructure & Deployment**
   - Local deployment on Minikube for testing
   - Free-tier services:
     - Redpanda (Docker for local / Cloud serverless for production)
     - Neon PostgreSQL for task database

5. **Best Practices**
   - Keep backend and frontend loosely coupled
   - Use Dapr abstraction to simplify event-driven architecture
   - Ensure all Kafka events are published and consumed reliably
   - Validate all user inputs with Pydantic schemas
   - Make UI reactive and responsive for multiple clients

## Example Implementation

**Backend (FastAPI + Dapr Pub/Sub)**
```python
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.post("/tasks")
async def create_task(task: dict):
    # Save task to DB (Neon)
    # Publish event via Dapr Pub/Sub
    await httpx.post(
        "http://localhost:3500/v1.0/publish/kafka-pubsub/task-events",
        json={"event_type": "created", "task_id": task["id"], "task_data": task}
    )
    return {"status": "task created"}
