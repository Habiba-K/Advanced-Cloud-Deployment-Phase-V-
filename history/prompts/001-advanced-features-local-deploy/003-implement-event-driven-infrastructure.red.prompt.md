---
id: 003
title: Implement Event-Driven Infrastructure Foundation
stage: red
date: 2026-02-09
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-advanced-features-local-deploy
branch: 001-advanced-features-local-deploy
user: User
command: implementation
labels: ["event-driven", "dapr", "kafka", "infrastructure", "pub-sub"]
links:
  spec: specs/001-advanced-features-local-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/schemas/events.py
  - backend/src/config.py
  - backend/src/services/dapr_client.py
  - backend/src/services/event_publisher.py
tests:
  - Verified event schemas can be imported successfully
---

## Prompt

Implement the foundational event-driven infrastructure for Phase V. Complete tasks T006-T009 from the tasks.md file:

**T006 [P]**: Create event schemas in backend/src/schemas/events.py with Pydantic models:
- TaskEvent: event_id, event_type (created/updated/completed/deleted), task_id, user_id, task_data (dict), timestamp
- ReminderEvent: event_id, task_id, user_id, title, due_at, remind_at, timestamp
- TaskUpdateEvent: event_id, event_type, task_id, user_id, task_data (dict), timestamp

**T007 [P]**: Update backend/src/config.py to add:
- DAPR_HTTP_PORT: int = 3500
- DAPR_PUBSUB_NAME: str = "kafka-pubsub"

**T008**: Create Dapr client in backend/src/services/dapr_client.py with httpx.AsyncClient:
- publish_event(pubsubname: str, topic: str, data: dict) - POST to http://localhost:3500/v1.0/publish/{pubsubname}/{topic}
- get_state(store: str, key: str) - GET from http://localhost:3500/v1.0/state/{store}/{key}
- save_state(store: str, key: str, value: dict) - POST to http://localhost:3500/v1.0/state/{store}
- get_secret(store: str, key: str) - GET from http://localhost:3500/v1.0/secrets/{store}/{key}
- Include retry logic: 3 attempts with exponential backoff
- Handle errors appropriately

**T009**: Create event publisher in backend/src/services/event_publisher.py:
- publish_task_event(event_type: str, task: Task, user_id: str) - Builds TaskEvent schema, generates UUID event_id, calls Dapr client
- publish_reminder_event(task: Task, user_id: str) - Builds ReminderEvent schema, generates UUID event_id, calls Dapr client
- publish_task_update_event(event_type: str, task: Task, user_id: str) - Builds TaskUpdateEvent schema, generates UUID event_id, calls Dapr client

Reference the data-model.md for event schema details. Use the existing backend code style and patterns.

## Response snapshot

Successfully implemented all four tasks for the event-driven infrastructure foundation:

**T006 - Event Schemas (backend/src/schemas/events.py)**
Created three Pydantic models matching the data-model.md specification:
- TaskEvent: For task lifecycle events (created, updated, completed, deleted) published to 'task-events' topic
- ReminderEvent: For reminder notifications published to 'reminders' topic
- TaskUpdateEvent: For real-time updates published to 'task-updates' topic

All schemas include:
- event_id (UUID string) for idempotency
- Proper field types and descriptions
- Example JSON in Config for documentation
- ISO-8601 datetime formatting

**T007 - Configuration Updates (backend/src/config.py)**
Extended Settings class with Dapr configuration:
- dapr_http_port: int = 3500 (Dapr sidecar HTTP port)
- dapr_pubsub_name: str = "kafka-pubsub" (pub/sub component name)

**T008 - Dapr Client (backend/src/services/dapr_client.py)**
Implemented async HTTP client for Dapr sidecar communication:
- publish_event(): POST to /v1.0/publish/{pubsubname}/{topic}
- get_state(): GET from /v1.0/state/{store}/{key}
- save_state(): POST to /v1.0/state/{store}
- get_secret(): GET from /v1.0/secrets/{store}/{key}

Features:
- Exponential backoff retry logic (3 attempts, 0.5s base delay)
- Proper error handling and logging
- 10-second timeout for all requests
- Singleton instance pattern

**T009 - Event Publisher (backend/src/services/event_publisher.py)**
Implemented high-level event publishing functions:
- publish_task_event(): Publishes to 'task-events' topic for recurring task service and audit service
- publish_reminder_event(): Publishes to 'reminders' topic for notification service
- publish_task_update_event(): Publishes to 'task-updates' topic for WebSocket service

Features:
- Automatic UUID generation for event_id
- Task model to dict conversion with backward compatibility
- Comprehensive logging for debugging
- Validation for reminder events (requires due_date and remind_at)
- Uses Dapr client with retry logic

All implementations follow existing backend patterns and are ready for integration with task CRUD operations.

## Outcome

- ✅ Impact: Foundational event-driven infrastructure complete. Ready for integration with task operations and microservices.
- 🧪 Tests: Event schemas import successfully. Manual integration testing required when Dapr is deployed.
- 📁 Files: 3 new files created, 1 file modified (config.py)
- 🔁 Next prompts: Integrate event publishers into task CRUD operations (create, update, complete, delete). Deploy Dapr components for local testing.
- 🧠 Reflection: Clean separation of concerns - schemas, client, and publisher are independent modules. Retry logic ensures resilience. Ready for Kafka/Dapr integration.

## Evaluation notes (flywheel)

- Failure modes observed: None during implementation. Potential runtime failures: Dapr sidecar not running, network issues, Kafka unavailable.
- Graders run and results (PASS/FAIL): Import test PASS. Integration tests pending Dapr deployment.
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add event publishing to existing task_service.py CRUD operations to verify end-to-end flow.
