# Event-Driven Infrastructure Expert Memory

## Project Context
Phase V Advanced Cloud Deployment - Todo application with Dapr + Kafka event-driven architecture.

## Completed Infrastructure (2026-02-09)

### Event Schemas (backend/src/schemas/events.py)
Three Pydantic models for Kafka events via Dapr Pub/Sub:

1. **TaskEvent** → `task-events` topic
   - Consumers: Recurring Task Service, Audit Service
   - Fields: event_id, event_type, task_id, user_id, task_data, timestamp
   - Event types: created, updated, completed, deleted

2. **ReminderEvent** → `reminders` topic
   - Consumer: Notification Service
   - Fields: event_id, task_id, user_id, title, due_at, remind_at, timestamp
   - Requires: task.due_date and task.remind_at must be set

3. **TaskUpdateEvent** → `task-updates` topic
   - Consumer: WebSocket Service (real-time sync)
   - Fields: event_id, event_type, task_id, user_id, task_data, timestamp

### Dapr Client (backend/src/services/dapr_client.py)
Async HTTP client for Dapr sidecar (localhost:3500):
- `publish_event(pubsubname, topic, data)` - Pub/Sub publishing
- `get_state(store, key)` - State management read
- `save_state(store, key, value)` - State management write
- `get_secret(store, key)` - Secrets retrieval
- Retry logic: 3 attempts, exponential backoff (0.5s base)
- Singleton instance: `dapr_client`

### Event Publisher (backend/src/services/event_publisher.py)
High-level publishing functions:
- `publish_task_event(event_type, task, user_id)` - Task lifecycle events
- `publish_reminder_event(task, user_id)` - Reminder scheduling
- `publish_task_update_event(event_type, task, user_id)` - Real-time updates
- Auto-generates UUID event_id for idempotency
- Comprehensive logging for debugging

### Configuration (backend/src/config.py)
Added Dapr settings:
- `dapr_http_port: int = 3500`
- `dapr_pubsub_name: str = "kafka-pubsub"`

## Kafka Topics

| Topic | Purpose | Producers | Consumers |
|-------|---------|-----------|-----------|
| task-events | Task lifecycle | Backend API | Recurring Task Service, Audit Service |
| reminders | Scheduled reminders | Backend API | Notification Service |
| task-updates | Real-time sync | Backend API | WebSocket Service |

## Integration Pattern

When task operations occur in backend API:
```python
from services.event_publisher import publish_task_event, publish_task_update_event

# After creating/updating/completing/deleting a task:
await publish_task_event(event_type="created", task=task, user_id=user_id)
await publish_task_update_event(event_type="created", task=task, user_id=user_id)

# When task has due_date and remind_at:
await publish_reminder_event(task=task, user_id=user_id)
```

## Next Steps

1. **Integrate with Task CRUD** (T010-T013):
   - Add event publishing to task_service.py operations
   - Publish on create, update, complete, delete
   - Publish reminders when due_date is set

2. **Deploy Dapr Components**:
   - Create dapr-components/kafka-pubsub.yaml
   - Create dapr-components/statestore.yaml
   - Create dapr-components/reminder-cron.yaml
   - Create dapr-components/kubernetes-secrets.yaml

3. **Local Testing**:
   - Start Redpanda Docker container
   - Initialize Dapr on Minikube
   - Deploy backend with Dapr sidecar
   - Verify event flow end-to-end

## Common Patterns

### Error Handling
All Dapr operations include retry logic. Failures are logged but may need application-level handling for critical operations.

### Idempotency
Every event has a unique event_id (UUID). Consumers should use this for deduplication.

### Backward Compatibility
Task model conversion handles missing fields (priority, due_date, etc.) with defaults for gradual migration.

## Gotchas

1. **Dapr Sidecar Required**: All operations fail if Dapr sidecar isn't running on localhost:3500
2. **Reminder Validation**: publish_reminder_event() raises ValueError if due_date or remind_at is missing
3. **Datetime Handling**: due_date (date) is converted to datetime for ReminderEvent
4. **Network Timeouts**: All HTTP requests have 10s timeout - adjust for slow networks

## Files Created

- `D:\New folder\gemini CLI LECTURES\projects\Advanced Cloud Deployment (Phase-V )\backend\src\schemas\events.py`
- `D:\New folder\gemini CLI LECTURES\projects\Advanced Cloud Deployment (Phase-V )\backend\src\services\dapr_client.py`
- `D:\New folder\gemini CLI LECTURES\projects\Advanced Cloud Deployment (Phase-V )\backend\src\services\event_publisher.py`

## Files Modified

- `D:\New folder\gemini CLI LECTURES\projects\Advanced Cloud Deployment (Phase-V )\backend\src\config.py`
