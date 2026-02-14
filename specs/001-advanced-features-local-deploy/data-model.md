# Data Model: Advanced Features & Local Deployment

**Feature**: 001-advanced-features-local-deploy
**Date**: 2026-02-08

## Entities

### Task (EXTEND existing `backend/src/models/task.py`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | Existing |
| user_id | string(255) | NOT NULL, indexed | Existing |
| title | string(500) | NOT NULL | Existing |
| description | text | nullable | Existing |
| completed | boolean | default False | Existing — KEEP for backward compat |
| status | enum(pending, completed) | default 'pending' | NEW — replaces completed boolean over time |
| priority | enum(low, medium, high) | default 'medium' | NEW |
| due_date | date | nullable | NEW |
| remind_at | datetime | nullable | NEW — when to send reminder |
| recurrence_pattern | enum(none, daily, weekly, monthly) | default 'none' | NEW |
| recurrence_interval | integer | nullable, default 1 | NEW — e.g., every 2 weeks |
| next_occurrence | date | nullable | NEW — calculated on completion |
| completed_at | datetime | nullable | NEW — set when marked complete |
| deleted_at | datetime | nullable | NEW — soft delete |
| created_at | datetime | NOT NULL, default utcnow | Existing |
| updated_at | datetime | NOT NULL, default utcnow | Existing |

**Indexes**: user_id, status, priority, due_date, deleted_at
**Validation**:
- title: 1-500 chars, non-empty after trim
- priority: must be one of low, medium, high
- recurrence_pattern: must be one of none, daily, weekly, monthly
- recurrence_interval: must be >= 1 if recurrence_pattern != none
- remind_at: must be before due_date if both set
- Soft-delete filter: all queries MUST exclude deleted_at IS NOT NULL

**State Transitions**:
```
pending -> completed (sets completed_at, triggers recurring task event if applicable)
completed -> pending (clears completed_at)
any -> deleted (sets deleted_at, soft delete)
```

### Tag (NEW `backend/src/models/tag.py`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| user_id | string(255) | NOT NULL, indexed | User-scoped |
| name | string(100) | NOT NULL | |
| color | string(7) | nullable, default '#6B7280' | Hex color code |
| created_at | datetime | NOT NULL, default utcnow | |

**Indexes**: (user_id, name) UNIQUE
**Validation**:
- name: 1-100 chars, non-empty after trim
- color: must match `#[0-9a-fA-F]{6}` pattern if provided
- Unique name per user (enforced at DB level)

### TodoTag (NEW `backend/src/models/todo_tag.py`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| todo_id | UUID | FK(tasks.id), PK | CASCADE on delete |
| tag_id | UUID | FK(tags.id), PK | CASCADE on delete |

**Indexes**: Composite PK (todo_id, tag_id)
**Note**: Junction table for many-to-many relationship. Deleting a tag removes all associations. Deleting a task (soft) keeps associations for audit purposes.

### AuditLog (NEW `backend/src/models/audit_log.py`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| user_id | string(255) | NOT NULL, indexed | |
| event_type | string(50) | NOT NULL | created, updated, completed, deleted |
| task_id | UUID | NOT NULL | Reference to task (not FK — task may be deleted) |
| task_data | JSONB | NOT NULL | Full task snapshot at event time |
| event_id | string(255) | UNIQUE | Kafka message ID for idempotency |
| timestamp | datetime | NOT NULL, default utcnow | |

**Indexes**: user_id, timestamp DESC, event_id UNIQUE
**Validation**:
- event_type: must be one of created, updated, completed, deleted
- task_data: must be valid JSON
- event_id: unique constraint prevents duplicate processing

## Event Schemas

### TaskEvent (published to `task-events` topic)

```json
{
  "event_id": "uuid-string",
  "event_type": "created | updated | completed | deleted",
  "task_id": "uuid-string",
  "user_id": "user-id-string",
  "task_data": {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "status": "pending | completed",
    "priority": "low | medium | high",
    "due_date": "YYYY-MM-DD | null",
    "recurrence_pattern": "none | daily | weekly | monthly",
    "recurrence_interval": 1,
    "tags": ["tag-name-1", "tag-name-2"]
  },
  "timestamp": "ISO-8601 datetime"
}
```

### ReminderEvent (published to `reminders` topic)

```json
{
  "event_id": "uuid-string",
  "task_id": "uuid-string",
  "user_id": "user-id-string",
  "title": "string",
  "due_at": "ISO-8601 datetime",
  "remind_at": "ISO-8601 datetime",
  "timestamp": "ISO-8601 datetime"
}
```

### TaskUpdateEvent (published to `task-updates` topic)

```json
{
  "event_id": "uuid-string",
  "event_type": "created | updated | completed | deleted",
  "task_id": "uuid-string",
  "user_id": "user-id-string",
  "task_data": { "...full task snapshot..." },
  "timestamp": "ISO-8601 datetime"
}
```

## Relationships

```
users 1──N tasks       (user_id FK)
users 1──N tags        (user_id FK)
tasks N──N tags        (via todo_tags junction)
users 1──N audit_log   (user_id, no FK constraint on task_id)
```

## Query Patterns

### List Tasks with Filters (backend/src/services/task_service.py)

```
SELECT tasks.*, array_agg(tags.name) as tag_names
FROM tasks
LEFT JOIN todo_tags ON tasks.id = todo_tags.todo_id
LEFT JOIN tags ON todo_tags.tag_id = tags.id
WHERE tasks.user_id = :user_id
  AND tasks.deleted_at IS NULL
  AND (:status IS NULL OR tasks.status = :status)
  AND (:priority IS NULL OR tasks.priority = :priority)
  AND (:search IS NULL OR (tasks.title ILIKE :search OR tasks.description ILIKE :search))
  AND (:due_date_from IS NULL OR tasks.due_date >= :due_date_from)
  AND (:due_date_to IS NULL OR tasks.due_date <= :due_date_to)
  AND (:tag_ids IS NULL OR tags.id = ANY(:tag_ids))
GROUP BY tasks.id
ORDER BY :sort_field :sort_direction
LIMIT :limit OFFSET :offset
```

### Reminder Cron Check

```
SELECT * FROM tasks
WHERE deleted_at IS NULL
  AND status = 'pending'
  AND remind_at IS NOT NULL
  AND remind_at <= NOW() + INTERVAL '5 minutes'
  AND remind_at > NOW()
  AND completed_at IS NULL
```
