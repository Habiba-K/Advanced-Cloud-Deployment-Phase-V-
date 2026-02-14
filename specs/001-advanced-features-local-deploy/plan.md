# Implementation Plan: Advanced Features & Local Deployment

**Branch**: `001-advanced-features-local-deploy` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-advanced-features-local-deploy/spec.md`

## Summary

Extend the existing Todo application (FastAPI backend + Next.js frontend + Neon PostgreSQL) with advanced task management features (priorities, tags, due dates, reminders, recurring tasks, search/filter/sort, audit log, real-time sync) powered by an event-driven architecture using Kafka (Redpanda) via Dapr Pub/Sub. Deploy the full microservices stack to Minikube with Dapr sidecars, Helm charts, and all 5 Dapr building blocks (Pub/Sub, State, Bindings, Secrets, Service Invocation).

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (frontend)
**Primary Dependencies**:
- Backend: FastAPI 0.109, SQLModel 0.14, asyncpg, Pydantic, httpx (for Dapr sidecar HTTP calls)
- Frontend: Next.js 16.1, React 19, Tailwind CSS 4, react-hook-form
- Infrastructure: Dapr 1.14+, Redpanda (Kafka-compatible), Helm 3.x, Minikube
**Storage**: Neon Serverless PostgreSQL (free tier) via asyncpg + SQLModel
**Testing**: pytest + pytest-asyncio (backend), manual E2E on Minikube
**Target Platform**: Kubernetes (Minikube local, DOKS/GKE/AKS cloud)
**Project Type**: Web application (microservices)
**Performance Goals**: <1s search/filter, <5s recurring task creation, <2s real-time sync, <5min reminder delivery
**Constraints**: Free-tier only (Neon, Redpanda Cloud, cloud K8s credits), Dapr abstractions only (no direct Kafka clients)
**Scale/Scope**: 50 concurrent users, 6 microservices, 3 Kafka topics, 5 Dapr building blocks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|---|---|---|
| I | Security-First Design | PASS | Existing JWT auth via Better Auth. All new endpoints require auth. User ID in event payloads. Dapr mTLS for inter-service. Secrets via K8s Secrets + Dapr secretstore. |
| II | Event-Driven Architecture | PASS | 3 Kafka topics (task-events, reminders, task-updates) via Dapr Pub/Sub. 4 consumer services. Idempotent consumers. No direct service calls between producer/consumer. |
| III | Clean Separation of Concerns | PASS | 6 services: Frontend, Backend API, Recurring Task, Notification, Audit, WebSocket. Each in own K8s pod with Dapr sidecar. Communication via Dapr only. |
| IV | Dapr-Abstracted Infrastructure | PASS | All Kafka via Dapr Pub/Sub HTTP API. State via Dapr state store. Cron via Dapr binding. Secrets via Dapr secretstore. No kafka-python or aiokafka. |
| V | Advanced Task Features | PASS | Priority (H/M/L), tags (many-to-many), due dates, reminders, recurrence (daily/weekly/monthly), search, filter, sort. All user-scoped. |
| VI | Database as Single Source of Truth | PASS | Neon PostgreSQL. Write to DB before publishing events. Extended schema with tags, todo_tags, audit_log tables. Soft deletes. |
| VII | Maintainability and Testability | PASS | Each service independently testable. Clear module separation. Helm parameterized for local/cloud. Event schemas documented. |
| VIII | Local-First Deployment | PASS | Minikube deployment with Dapr + Redpanda Docker. E2E validation before cloud. |
| IX | Cloud-Ready Deployment | N/A | Cloud deployment is Part C (separate feature). This plan covers Parts A + B only. |
| X | Free-Tier Resource Strategy | PASS | Neon free tier. Redpanda Docker (local). No paid services. |

**Gate result: PASS** — No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-advanced-features-local-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── tasks-api.yaml
│   ├── tags-api.yaml
│   ├── audit-api.yaml
│   └── dapr-subscriptions.yaml
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                  # FastAPI app entry (EXTEND)
│   ├── database.py              # Async engine + session (KEEP)
│   ├── config.py                # Settings (EXTEND with Dapr config)
│   ├── dependencies.py          # Shared dependencies (KEEP)
│   ├── auth/                    # Auth module (KEEP as-is)
│   │   ├── dependencies.py
│   │   ├── schemas.py
│   │   └── utils.py
│   ├── models/                  # SQLModel entities (EXTEND)
│   │   ├── task.py              # EXTEND: add priority, due_date, remind_at, recurrence fields
│   │   ├── tag.py               # NEW: Tag model
│   │   ├── todo_tag.py          # NEW: Junction table
│   │   ├── audit_log.py         # NEW: Audit log model
│   │   └── user.py              # KEEP
│   ├── schemas/                 # Pydantic schemas (EXTEND)
│   │   ├── task.py              # EXTEND: add priority, tags, due_date, recurrence, search/filter params
│   │   ├── tag.py               # NEW: Tag CRUD schemas
│   │   ├── audit.py             # NEW: Audit log response schema
│   │   └── events.py            # NEW: Kafka event payload schemas
│   ├── routers/                 # API routes (EXTEND)
│   │   ├── tasks.py             # EXTEND: add filter/sort/search params, Dapr event publishing
│   │   ├── tags.py              # NEW: Tag CRUD endpoints
│   │   ├── audit.py             # NEW: Audit log endpoint
│   │   └── dapr.py              # NEW: Dapr subscription + cron binding endpoints
│   └── services/                # Business logic (EXTEND)
│       ├── task_service.py      # EXTEND: add filter/sort/search, event publishing via Dapr
│       ├── tag_service.py       # NEW: Tag CRUD logic
│       ├── dapr_client.py       # NEW: Dapr sidecar HTTP client (publish, state, secrets)
│       └── event_publisher.py   # NEW: Event publishing helper (wraps Dapr pub/sub)
├── requirements.txt             # EXTEND: add httpx
└── Dockerfile                   # NEW: Container image

services/                        # NEW: Microservices
├── recurring-task/
│   ├── main.py                  # FastAPI app subscribed to task-events
│   ├── Dockerfile
│   └── requirements.txt
├── notification/
│   ├── main.py                  # FastAPI app subscribed to reminders
│   ├── Dockerfile
│   └── requirements.txt
├── audit/
│   ├── main.py                  # FastAPI app subscribed to task-events
│   ├── Dockerfile
│   └── requirements.txt
└── websocket/
    ├── main.py                  # FastAPI app subscribed to task-updates + WebSocket
    ├── Dockerfile
    └── requirements.txt

frontend/
├── app/                         # Next.js App Router (EXTEND)
│   ├── dashboard/page.tsx       # EXTEND: add search, filter, sort, tag filter UI
│   ├── tasks/new/page.tsx       # NEW: Create task with priority, tags, due date, recurrence
│   ├── tasks/[id]/edit/page.tsx # EXTEND: add priority, tags, due date, recurrence fields
│   ├── tags/page.tsx            # NEW: Tag management page
│   ├── audit/page.tsx           # NEW: Audit log viewer
│   └── page.tsx                 # KEEP: Homepage
├── components/                  # React components (EXTEND)
│   ├── TaskCard.tsx             # EXTEND: priority badge, tag chips, due date, recurrence indicator
│   ├── SearchBar.tsx            # NEW: Debounced search input
│   ├── FilterPanel.tsx          # NEW: Multi-criteria filter UI
│   ├── SortControls.tsx         # NEW: Sort dropdown with asc/desc toggle
│   ├── TagChip.tsx              # NEW: Tag display component
│   ├── TagSelector.tsx          # NEW: Tag multi-select for forms
│   ├── PriorityBadge.tsx        # NEW: Color-coded priority indicator
│   ├── RecurrenceSelector.tsx   # NEW: Recurrence pattern picker
│   ├── NotificationToast.tsx    # NEW: In-app notification display
│   └── AuditEntry.tsx           # NEW: Audit log entry component
├── lib/                         # Utilities (EXTEND)
│   ├── api.ts                   # EXTEND: add tag, audit, search endpoints
│   └── websocket.ts             # NEW: WebSocket client for real-time sync
└── Dockerfile                   # NEW: Container image

dapr-components/                 # NEW: Dapr component YAML configs
├── kafka-pubsub.yaml            # Pub/Sub component (Redpanda)
├── statestore.yaml              # State store (PostgreSQL)
├── reminder-cron.yaml           # Cron binding (every 5 min)
└── kubernetes-secrets.yaml      # Secrets store

k8s/                             # NEW: Kubernetes manifests
├── base/
│   ├── namespace.yaml
│   └── secrets.yaml
└── overlays/
    ├── local/                   # Minikube-specific
    │   └── kustomization.yaml
    └── cloud/                   # Cloud-specific (Phase V Part C)
        └── kustomization.yaml

helm/                            # NEW: Helm charts
├── todo-app/
│   ├── Chart.yaml
│   ├── values.yaml              # Default values
│   ├── values-local.yaml        # Minikube overrides
│   └── templates/
│       ├── frontend-deployment.yaml
│       ├── backend-deployment.yaml
│       ├── recurring-task-deployment.yaml
│       ├── notification-deployment.yaml
│       ├── audit-deployment.yaml
│       ├── websocket-deployment.yaml
│       ├── services.yaml
│       └── dapr-components.yaml

docker-compose.redpanda.yml      # NEW: Local Redpanda for development
```

**Structure Decision**: Extend existing web app structure (backend/ + frontend/) with new services/ directory for event-driven microservices. Add dapr-components/, k8s/, and helm/ directories for infrastructure-as-code. Each microservice is a lightweight FastAPI app with its own Dockerfile.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 6 microservices (exceeds typical 2-3) | Each Kafka consumer needs its own pod with Dapr sidecar to subscribe to topics independently | Combining consumers into one service breaks the separation of concerns principle and makes scaling impossible per-consumer |
| httpx dependency for Dapr calls | Dapr sidecar communication is via HTTP REST API | Using direct Kafka client (kafka-python) would violate Principle IV (Dapr-Abstracted Infrastructure) |
| 3 Kafka topics (task-events, reminders, task-updates) | Event-driven architecture requires separate topics for different event types and consumer patterns | Single topic would mix concerns and make consumer filtering complex; violates Principle II (Event-Driven Architecture) |
| WebSocket for real-time sync | Real-time bidirectional communication required for instant task updates across clients | Polling would waste bandwidth and not be truly real-time; SSE is one-directional only |
| Helm charts with values overrides | Parameterized deployment for local vs. cloud environments | Separate manifests per environment would duplicate 90% of YAML; Kustomize alone lacks templating power |

**Complexity Budget**: 5 violations justified. All align with constitution principles and free-tier constraints.

---

## Phase 0: Research

*GATE: Must complete before Phase 1 design. Output: research.md with 10 decisions.*

**Status**: ✅ COMPLETE — See [research.md](research.md)

### Research Summary

Ten architectural decisions were researched and documented:

**R1: Dapr Pub/Sub Integration with FastAPI**
- **Decision**: Use httpx to POST to Dapr sidecar at `http://localhost:3500/v1.0/publish/{pubsubname}/{topic}`
- **Rationale**: No Kafka-specific libraries needed; Dapr HTTP API is simple and transparent
- **Rejected**: kafka-python (violates Principle IV), dapr Python SDK (unnecessary dependency)

**R2: Dapr Subscription Pattern for Consumer Services**
- **Decision**: Each consumer is a FastAPI app with `GET /dapr/subscribe` and `POST /{topic}` endpoints
- **Rationale**: Programmatic subscription model recommended by Dapr; flexible for dynamic routing
- **Rejected**: Declarative YAML subscriptions (less flexible)

**R3: Redpanda as Local Kafka Replacement**
- **Decision**: Use Redpanda Docker container (`redpandadata/redpanda:latest`) for Minikube
- **Rationale**: Single binary, Kafka-compatible, no Zookeeper, 512MB memory, works with Dapr unchanged
- **Rejected**: Apache Kafka (requires Zookeeper, 2GB memory), Strimzi (overkill for local)

**R4: Database Schema Migration Strategy**
- **Decision**: Extend Task model with new columns; create tags, todo_tags, audit_log tables; use SQLModel `create_all` initially
- **Rationale**: Follows existing pattern; Alembic can be added later for production migrations
- **Rejected**: Alembic from day one (adds complexity), separate database per service (overcomplicated)

**R5: Search Implementation**
- **Decision**: Use PostgreSQL `ILIKE` for text search across title and description
- **Rationale**: Performant for 100-1000 tasks per user; no external search engine needed
- **Rejected**: PostgreSQL full-text search (defer to optimization), Elasticsearch (overkill)

**R6: Real-Time Sync Architecture**
- **Decision**: WebSocket Service subscribes to `task-updates` topic; broadcasts to user's WebSocket connections
- **Rationale**: True bidirectional real-time communication; standard Kafka-to-WebSocket bridge pattern
- **Rejected**: SSE (one-directional), polling (not real-time), direct Kafka in browser (impossible)

**R7: Helm Chart Structure**
- **Decision**: Single Helm chart (`todo-app`) with templates for all 6 services; use `values-local.yaml` for Minikube overrides
- **Rationale**: One `helm install` command; values overrides avoid duplicating templates
- **Rejected**: Separate charts per service (harder to coordinate), Kustomize only (less flexible)

**R8: Dapr Cron Binding for Reminders**
- **Decision**: Use `bindings.cron` with schedule `*/5 * * * *`; invokes `POST /reminder-cron` on backend
- **Rationale**: Reliable scheduled execution without external cron; 5-minute window balances timeliness with DB load
- **Rejected**: APScheduler (not K8s-native), Kubernetes CronJob (adds manifest complexity)

**R9: Event Idempotency Strategy**
- **Decision**: Store processed event ID in database or Dapr state store; check before processing; skip duplicates
- **Rationale**: Kafka provides at-least-once delivery; idempotency prevents duplicate recurring tasks or audit entries
- **Rejected**: Exactly-once semantics (not supported by Dapr Pub/Sub)

**R10: Notification Delivery Mechanism**
- **Decision**: In-app notifications via WebSocket push; Notification Service publishes to `task-updates` topic
- **Rationale**: No external services needed; works within existing WebSocket infrastructure
- **Rejected**: Email (requires email service), browser push (requires service worker), polling (not real-time)

**Research Gate Result**: PASS — All 10 decisions documented with rationale and alternatives.

---

## Phase 1: Design

*GATE: Must complete before Phase 2 implementation. Output: data-model.md, contracts/, quickstart.md.*

**Status**: ✅ COMPLETE — See [data-model.md](data-model.md) and [contracts/](contracts/)

### Design Artifacts Summary

**1. Data Model** ([data-model.md](data-model.md))

**Entities**:
- **Task** (EXTEND existing): Added priority, due_date, remind_at, recurrence_pattern, recurrence_interval, next_occurrence, completed_at, deleted_at, status (enum)
- **Tag** (NEW): id, user_id, name, color, created_at
- **TodoTag** (NEW): Junction table (todo_id, tag_id) with CASCADE delete
- **AuditLog** (NEW): id, user_id, event_type, task_id, task_data (JSONB), event_id (unique), timestamp

**Event Schemas**:
- **TaskEvent**: event_id, event_type (created/updated/completed/deleted), task_id, user_id, task_data, timestamp
- **ReminderEvent**: event_id, task_id, user_id, title, due_at, remind_at, timestamp
- **TaskUpdateEvent**: event_id, event_type, task_id, user_id, task_data, timestamp

**Relationships**:
- users 1→N tasks (user_id FK)
- users 1→N tags (user_id FK)
- tasks N→N tags (via todo_tags junction)
- users 1→N audit_log (user_id, no FK on task_id)

**Key Query Patterns**:
- List tasks with filters: JOIN tags, filter by status/priority/search/due_date/tag_ids, ORDER BY, LIMIT/OFFSET
- Reminder cron check: WHERE deleted_at IS NULL AND status='pending' AND remind_at <= NOW() + 5 minutes

**2. API Contracts** ([contracts/](contracts/))

**tasks-api.yaml** (OpenAPI 3.1):
- `GET /{user_id}/tasks` — List with search, filter (status, priority, tag_ids, due_date_from/to), sort (created_at, due_date, priority, title), pagination
- `POST /{user_id}/tasks` — Create with priority, tags, due_date, remind_at, recurrence
- `GET /{user_id}/tasks/{task_id}` — Get single task
- `PUT /{user_id}/tasks/{task_id}` — Update task
- `DELETE /{user_id}/tasks/{task_id}` — Soft delete
- `PATCH /{user_id}/tasks/{task_id}/complete` — Mark complete (triggers recurring task event)
- `PATCH /{user_id}/tasks/{task_id}/incomplete` — Mark incomplete

**tags-api.yaml** (OpenAPI 3.1):
- `GET /{user_id}/tags` — List user's tags with task_count
- `POST /{user_id}/tags` — Create tag (unique name per user)
- `PUT /{user_id}/tags/{tag_id}` — Update tag (name, color)
- `DELETE /{user_id}/tags/{tag_id}` — Delete tag (CASCADE removes associations)

**audit-api.yaml** (OpenAPI 3.1):
- `GET /{user_id}/audit` — List audit entries with filters (event_type, task_id, from_date, to_date), pagination

**dapr-subscriptions.yaml**:
- `GET /dapr/subscribe` — Dapr subscription discovery (returns array of {pubsubname, topic, route})
- `POST /task-events` — Handle TaskEvent (Recurring Task Service, Audit Service)
- `POST /reminders` — Handle ReminderEvent (Notification Service)
- `POST /task-updates` — Handle TaskUpdateEvent (WebSocket Service)
- `POST /reminder-cron` — Dapr cron binding handler (every 5 minutes)

**Design Gate Result**: PASS — All entities, events, and API contracts documented with validation rules.

---

## Phase 2: Implementation Phases

*GATE: Must pass Phase 1 design gate. Output: Working code in sequential phases.*

### Phase 2.1: Database Schema & Models

**Objective**: Extend database schema with new tables and columns; update SQLModel models.

**Tasks**:
1. **Extend Task model** (`backend/src/models/task.py`):
   - Add columns: priority (enum), due_date (date), remind_at (datetime), recurrence_pattern (enum), recurrence_interval (int), next_occurrence (date), completed_at (datetime), deleted_at (datetime), status (enum)
   - Add indexes: status, priority, due_date, deleted_at
   - Keep `completed` boolean for backward compatibility

2. **Create Tag model** (`backend/src/models/tag.py`):
   - Fields: id (UUID), user_id (string), name (string), color (string), created_at (datetime)
   - Unique constraint: (user_id, name)

3. **Create TodoTag junction model** (`backend/src/models/todo_tag.py`):
   - Composite PK: (todo_id, tag_id)
   - Foreign keys with CASCADE delete

4. **Create AuditLog model** (`backend/src/models/audit_log.py`):
   - Fields: id (UUID), user_id (string), event_type (string), task_id (UUID), task_data (JSONB), event_id (string, unique), timestamp (datetime)
   - Index: user_id, timestamp DESC, event_id UNIQUE

5. **Update database initialization** (`backend/src/database.py`):
   - Import new models
   - Ensure `SQLModel.metadata.create_all()` includes new tables

**Acceptance Criteria**:
- All models defined with proper types and constraints
- Database tables created on startup
- Indexes created for performance
- Backward compatibility maintained (completed boolean)

**Agent**: `neon-db-expert`

---

### Phase 2.2: Backend Core (Dapr Client & Event Publisher)

**Objective**: Implement Dapr HTTP client and event publishing infrastructure.

**Tasks**:
1. **Create Dapr client** (`backend/src/services/dapr_client.py`):
   - `publish_event(pubsubname: str, topic: str, data: dict)` — POST to `http://localhost:3500/v1.0/publish/{pubsubname}/{topic}`
   - `get_state(store: str, key: str)` — GET from `http://localhost:3500/v1.0/state/{store}/{key}`
   - `save_state(store: str, key: str, value: dict)` — POST to `http://localhost:3500/v1.0/state/{store}`
   - `get_secret(store: str, key: str)` — GET from `http://localhost:3500/v1.0/secrets/{store}/{key}`
   - Use httpx.AsyncClient for all calls
   - Handle errors with retries (3 attempts, exponential backoff)

2. **Create event publisher** (`backend/src/services/event_publisher.py`):
   - `publish_task_event(event_type: str, task: Task, user_id: str)` — Builds TaskEvent schema, calls Dapr client
   - `publish_reminder_event(task: Task, user_id: str)` — Builds ReminderEvent schema, calls Dapr client
   - `publish_task_update_event(event_type: str, task: Task, user_id: str)` — Builds TaskUpdateEvent schema, calls Dapr client
   - Generate event_id (UUID) for idempotency

3. **Create event schemas** (`backend/src/schemas/events.py`):
   - `TaskEvent` Pydantic model
   - `ReminderEvent` Pydantic model
   - `TaskUpdateEvent` Pydantic model

4. **Update config** (`backend/src/config.py`):
   - Add `DAPR_HTTP_PORT` (default 3500)
   - Add `DAPR_PUBSUB_NAME` (default "kafka-pubsub")

5. **Add httpx dependency** (`backend/requirements.txt`):
   - Add `httpx>=0.27.0`

**Acceptance Criteria**:
- Dapr client successfully publishes events to local Dapr sidecar
- Event schemas validated with Pydantic
- Retry logic handles transient failures
- Configuration externalized

**Agent**: `event-driven-infra-expert`, `backend-engineer`

---

### Phase 2.3: Backend APIs (Tasks, Tags, Audit, Dapr Endpoints)

**Objective**: Extend backend API with advanced features and Dapr subscription endpoints.

**Tasks**:
1. **Extend Task router** (`backend/src/routers/tasks.py`):
   - Update `GET /tasks` to accept search, filter (status, priority, tag_ids, due_date_from/to), sort (sort_by, sort_order), pagination (limit, offset)
   - Update `POST /tasks` to accept priority, tag_ids, due_date, remind_at, recurrence_pattern, recurrence_interval
   - Update `PUT /tasks/{id}` to accept new fields
   - Add `PATCH /tasks/{id}/complete` — Mark complete, publish TaskEvent (type: completed)
   - Add `PATCH /tasks/{id}/incomplete` — Mark incomplete, publish TaskEvent (type: updated)
   - Publish events after DB write: TaskEvent to `task-events`, ReminderEvent to `reminders` (if due_date set), TaskUpdateEvent to `task-updates`

2. **Create Tag router** (`backend/src/routers/tags.py`):
   - `GET /{user_id}/tags` — List user's tags with task_count
   - `POST /{user_id}/tags` — Create tag (validate unique name per user)
   - `PUT /{user_id}/tags/{id}` — Update tag
   - `DELETE /{user_id}/tags/{id}` — Delete tag (CASCADE removes todo_tags)

3. **Create Audit router** (`backend/src/routers/audit.py`):
   - `GET /{user_id}/audit` — List audit entries with filters (event_type, task_id, from_date, to_date), pagination

4. **Create Dapr router** (`backend/src/routers/dapr.py`):
   - `GET /dapr/subscribe` — Return empty array (backend is publisher only, not consumer)
   - `POST /reminder-cron` — Dapr cron binding handler:
     - Query tasks with `remind_at <= NOW() + 5 minutes AND remind_at > NOW() AND status='pending' AND deleted_at IS NULL`
     - Publish ReminderEvent for each task
     - Return `{"reminders_published": count}`

5. **Create Task service** (`backend/src/services/task_service.py`):
   - `list_tasks(user_id, filters, sort, pagination)` — Build dynamic query with SQLAlchemy
   - `create_task(user_id, data)` — Insert task, associate tags, publish events
   - `update_task(user_id, task_id, data)` — Update task, sync tags, publish events
   - `delete_task(user_id, task_id)` — Soft delete (set deleted_at), publish event
   - `complete_task(user_id, task_id)` — Set status='completed', completed_at=now(), publish event
   - `incomplete_task(user_id, task_id)` — Set status='pending', completed_at=null, publish event

6. **Create Tag service** (`backend/src/services/tag_service.py`):
   - `list_tags(user_id)` — Query tags with task_count (LEFT JOIN todo_tags)
   - `create_tag(user_id, data)` — Insert tag, handle unique constraint violation (409)
   - `update_tag(user_id, tag_id, data)` — Update tag, handle unique constraint
   - `delete_tag(user_id, tag_id)` — Delete tag (CASCADE removes associations)

7. **Update main.py** (`backend/src/main.py`):
   - Register new routers: tags, audit, dapr
   - Update CORS to allow frontend origin

**Acceptance Criteria**:
- All endpoints return correct status codes (200, 201, 400, 401, 404, 409)
- Search/filter/sort work correctly with pagination
- Events published after every task operation
- Tag CRUD with unique constraint enforcement
- Cron binding handler queries and publishes reminders
- All endpoints require JWT authentication

**Agent**: `backend-engineer`, `task-feature-engineer`

---

### Phase 2.4: Consumer Microservices

**Objective**: Implement 4 consumer services that subscribe to Kafka topics via Dapr.

**Tasks**:

**2.4.1: Recurring Task Service** (`services/recurring-task/`)
- **main.py**:
  - FastAPI app with `GET /dapr/subscribe` returning `[{pubsubname: "kafka-pubsub", topic: "task-events", route: "/task-events"}]`
  - `POST /task-events` handler:
    - Extract CloudEvent data (TaskEvent)
    - Check idempotency: query Dapr state store for event_id; skip if exists
    - If event_type == "completed" AND recurrence_pattern != "none":
      - Calculate next_occurrence based on pattern and interval
      - Create new task with same title, description, priority, tags, recurrence settings
      - Set due_date to next_occurrence
      - Publish TaskEvent (type: created) for new task
    - Save event_id to state store
    - Return `{"status": "SUCCESS"}`
- **Dockerfile**: Python 3.11, install FastAPI + httpx, EXPOSE 8001
- **requirements.txt**: fastapi, uvicorn, httpx, pydantic

**2.4.2: Notification Service** (`services/notification/`)
- **main.py**:
  - FastAPI app with `GET /dapr/subscribe` returning `[{pubsubname: "kafka-pubsub", topic: "reminders", route: "/reminders"}]`
  - `POST /reminders` handler:
    - Extract CloudEvent data (ReminderEvent)
    - Check idempotency: query Dapr state store for event_id; skip if exists
    - Query database to verify task is still pending (not completed or deleted)
    - If pending: publish TaskUpdateEvent to `task-updates` topic with notification payload
    - Save event_id to state store
    - Return `{"status": "SUCCESS"}`
- **Dockerfile**: Python 3.11, install FastAPI + httpx, EXPOSE 8002
- **requirements.txt**: fastapi, uvicorn, httpx, pydantic, asyncpg

**2.4.3: Audit Service** (`services/audit/`)
- **main.py**:
  - FastAPI app with `GET /dapr/subscribe` returning `[{pubsubname: "kafka-pubsub", topic: "task-events", route: "/task-events"}]`
  - `POST /task-events` handler:
    - Extract CloudEvent data (TaskEvent)
    - Check idempotency: query audit_log for event_id; skip if exists
    - Insert into audit_log table: user_id, event_type, task_id, task_data (JSONB), event_id, timestamp
    - Return `{"status": "SUCCESS"}`
- **Dockerfile**: Python 3.11, install FastAPI + asyncpg, EXPOSE 8003
- **requirements.txt**: fastapi, uvicorn, asyncpg, pydantic, sqlmodel

**2.4.4: WebSocket Service** (`services/websocket/`)
- **main.py**:
  - FastAPI app with WebSocket endpoint `GET /ws/{user_id}` — Maintains active connections per user_id
  - `GET /dapr/subscribe` returning `[{pubsubname: "kafka-pubsub", topic: "task-updates", route: "/task-updates"}]`
  - `POST /task-updates` handler:
    - Extract CloudEvent data (TaskUpdateEvent)
    - Find all active WebSocket connections for user_id
    - Broadcast event to all connections: `await websocket.send_json(task_data)`
    - Return `{"status": "SUCCESS"}`
  - Connection manager: dict of user_id → list of WebSocket connections
- **Dockerfile**: Python 3.11, install FastAPI + websockets, EXPOSE 8004
- **requirements.txt**: fastapi, uvicorn, websockets, pydantic

**Acceptance Criteria**:
- Each service runs independently with Dapr sidecar
- Subscription endpoints return correct metadata
- Event handlers process CloudEvents correctly
- Idempotency checks prevent duplicate processing
- Recurring Task Service creates next occurrence on completion
- Notification Service verifies task status before notifying
- Audit Service stores all events in audit_log table
- WebSocket Service broadcasts to connected clients

**Agent**: `event-driven-infra-expert`, `backend-engineer`

---

### Phase 2.5: Frontend UI (Search, Filter, Sort, Tags, Priorities, Recurrence)

**Objective**: Build Next.js UI for advanced task features and real-time sync.

**Tasks**:

**2.5.1: Dashboard Enhancements** (`frontend/app/dashboard/page.tsx`)
- Add SearchBar component with debounced input (300ms)
- Add FilterPanel component: status dropdown, priority dropdown, tag multi-select, due date range picker
- Add SortControls component: sort_by dropdown (created_at, due_date, priority, title), asc/desc toggle
- Update TaskCard to show: PriorityBadge, TagChips, due date, recurrence indicator
- Implement URL query params for filters/sort (persist state on refresh)
- Connect to WebSocket (`/ws/{user_id}`) for real-time updates
- On WebSocket message: update task list in state

**2.5.2: Task Create/Edit Forms** (`frontend/app/tasks/new/page.tsx`, `frontend/app/tasks/[id]/edit/page.tsx`)
- Add priority selector (dropdown: Low, Medium, High)
- Add TagSelector component (multi-select with create-new-tag option)
- Add due date picker (date input)
- Add reminder time picker (datetime input, must be before due_date)
- Add RecurrenceSelector component: pattern dropdown (None, Daily, Weekly, Monthly), interval input (e.g., every 2 weeks)
- Validate: remind_at < due_date, recurrence_interval >= 1

**2.5.3: Tag Management Page** (`frontend/app/tags/page.tsx`)
- List all user tags with task_count
- Create tag form: name input, color picker (hex color)
- Edit tag inline: rename, change color
- Delete tag with confirmation dialog
- Show error on duplicate tag name (409 response)

**2.5.4: Audit Log Page** (`frontend/app/audit/page.tsx`)
- List audit entries with pagination
- Filter by event_type dropdown (created, updated, completed, deleted)
- Filter by date range (from_date, to_date)
- Display AuditEntry component: timestamp, event_type badge, task snapshot (title, priority, tags)

**2.5.5: Components** (`frontend/components/`)
- **SearchBar.tsx**: Debounced input, calls API on change
- **FilterPanel.tsx**: Multi-criteria filter UI, updates URL params
- **SortControls.tsx**: Dropdown + asc/desc toggle, updates URL params
- **TagChip.tsx**: Colored tag badge with name
- **TagSelector.tsx**: Multi-select dropdown with create-new option
- **PriorityBadge.tsx**: Color-coded badge (Low=green, Medium=blue, High=red)
- **RecurrenceSelector.tsx**: Pattern dropdown + interval input
- **NotificationToast.tsx**: In-app notification display (triggered by WebSocket)
- **AuditEntry.tsx**: Audit log entry card

**2.5.6: API Client** (`frontend/lib/api.ts`)
- Add `searchTasks(query, filters, sort, pagination)` — GET /tasks with query params
- Add `createTag(name, color)` — POST /tags
- Add `updateTag(id, name, color)` — PUT /tags/{id}
- Add `deleteTag(id)` — DELETE /tags/{id}
- Add `listTags()` — GET /tags
- Add `listAudit(filters, pagination)` — GET /audit

**2.5.7: WebSocket Client** (`frontend/lib/websocket.ts`)
- `connectWebSocket(userId)` — Establish WebSocket connection to `/ws/{userId}`
- `onMessage(callback)` — Register callback for incoming messages
- `disconnect()` — Close connection
- Auto-reconnect on disconnect (exponential backoff)

**Acceptance Criteria**:
- Search works with debouncing (no API call on every keystroke)
- Filters combine correctly (AND logic)
- Sort works ascending/descending
- URL params persist filter/sort state
- Tag CRUD works with validation
- Priority badges color-coded correctly
- Recurrence selector validates interval >= 1
- WebSocket updates task list in real-time
- Audit log displays all events with filters

**Agent**: `nextjs-ui-builder`, `task-feature-engineer`

---

### Phase 2.6: Infrastructure (Dapr Components, Helm Charts, K8s Manifests)

**Objective**: Create Dapr component YAML configs, Helm charts, and Kubernetes manifests.

**Tasks**:

**2.6.1: Dapr Components** (`dapr-components/`)

Create the following component files:
- `kafka-pubsub.yaml` — Pub/Sub component for Redpanda (local: brokers=redpanda:9092, authType=none)
- `statestore.yaml` — State store component for PostgreSQL (connectionString from secrets)
- `reminder-cron.yaml` — Cron binding component (schedule: */5 * * * *)
- `kubernetes-secrets.yaml` — Secrets store component

**2.6.2: Kubernetes Manifests** (`k8s/`)

Create base manifests:
- `base/namespace.yaml` — Create todo-app namespace
- `base/secrets.yaml` — Template for db-secrets (connection-string)
- `overlays/local/kustomization.yaml` — Kustomize config for Minikube
- `overlays/local/redpanda-deployment.yaml` — Redpanda pod for local Kafka

**2.6.3: Helm Chart** (`helm/todo-app/`)

Create Helm chart structure:
- `Chart.yaml` — Chart metadata (name, version, description)
- `values.yaml` — Default values (image names, replicas, ports, Dapr config, Redpanda enabled)
- `values-local.yaml` — Minikube overrides (Redpanda enabled, local brokers)
- `values-cloud.yaml` — Cloud overrides (Redpanda disabled, cloud brokers with SASL)
- `templates/deployment-frontend.yaml` — Frontend deployment with Dapr annotations
- `templates/deployment-backend.yaml` — Backend deployment with Dapr annotations
- `templates/deployment-recurring-task.yaml` — Recurring task service deployment
- `templates/deployment-notification.yaml` — Notification service deployment
- `templates/deployment-audit.yaml` — Audit service deployment
- `templates/deployment-websocket.yaml` — WebSocket service deployment
- `templates/service-*.yaml` — ClusterIP services for each deployment
- `templates/redpanda-deployment.yaml` — Redpanda deployment (conditional on values.redpanda.enabled)
- `templates/dapr-components.yaml` — Dapr component resources

**Acceptance Criteria**:
- All Dapr components defined with correct metadata
- Helm chart installs all 6 services + Redpanda (local)
- Dapr sidecar annotations present on all pods
- Secrets referenced via secretKeyRef (not hardcoded)
- values-local.yaml enables Redpanda; values-cloud.yaml disables it
- Service Invocation configured for frontend-to-backend calls

**Agent**: `event-driven-infra-expert`, `dapr-cloud-deployer`

---

### Phase 2.7: Local Deployment & Validation

**Objective**: Deploy all services to Minikube and validate end-to-end functionality.

**Tasks**:

**2.7.1: Minikube Setup**
1. Start Minikube: `minikube start --memory=4096 --cpus=4`
2. Enable ingress addon: `minikube addons enable ingress`
3. Install Dapr on Minikube: `dapr init -k`
4. Verify Dapr installation: `dapr status -k`

**2.7.2: Build Docker Images**
1. Build all 6 service images
2. Load images into Minikube: `minikube image load <image-name>`

**2.7.3: Create Kubernetes Secrets**
1. Create namespace: `kubectl create namespace todo-app`
2. Create db-secrets with Neon connection string

**2.7.4: Apply Dapr Components**
1. Apply all components: `kubectl apply -f dapr-components/ -n todo-app`
2. Verify components: `kubectl get components -n todo-app`

**2.7.5: Deploy with Helm**
1. Install chart: `helm install todo-app ./helm/todo-app -f ./helm/todo-app/values-local.yaml -n todo-app`
2. Wait for pods: `kubectl wait --for=condition=ready pod --all -n todo-app --timeout=300s`
3. Check pod status: `kubectl get pods -n todo-app`

**2.7.6: Port Forwarding**
1. Forward frontend: `kubectl port-forward svc/frontend 3000:3000 -n todo-app`
2. Forward backend: `kubectl port-forward svc/backend 8000:8000 -n todo-app`
3. Forward websocket: `kubectl port-forward svc/websocket 8004:8004 -n todo-app`

**2.7.7: End-to-End Validation**
- Test authentication flow (signup, signin)
- Test task CRUD with all new fields
- Test recurring task creation on completion
- Test reminder cron trigger and notification delivery
- Test real-time sync across browser tabs
- Test search, filter, sort functionality
- Test tag management
- Verify audit log populated
- Check all service logs for errors

**Acceptance Criteria**:
- All pods running with 2/2 containers (app + Dapr sidecar)
- All Dapr components healthy
- End-to-end validation passes all tests
- No errors in any service logs

**Agent**: `local-stack-validator`

---

## Phase 3: Testing Strategy

*GATE: Must define test coverage before declaring implementation complete.*

### Unit Testing

**Backend Unit Tests** (`backend/tests/unit/`)

**test_dapr_client.py**:
- Test `publish_event` with mock httpx responses (200, 500, timeout)
- Test retry logic (3 attempts, exponential backoff)
- Test `get_state`, `save_state`, `get_secret` with mocks

**test_event_publisher.py**:
- Test `publish_task_event` builds correct TaskEvent schema
- Test `publish_reminder_event` builds correct ReminderEvent schema
- Test event_id generation (UUID format)
- Test error handling when Dapr client fails

**test_task_service.py**:
- Test `list_tasks` with various filter combinations
- Test search query building (ILIKE on title and description)
- Test sort logic (created_at, due_date, priority, title)
- Test pagination (limit, offset)
- Test `create_task` with tags association
- Test `update_task` with tag sync (add/remove)
- Test `delete_task` soft delete (sets deleted_at)
- Test `complete_task` with recurring task (recurrence_pattern != none)

**test_tag_service.py**:
- Test `create_tag` with unique constraint violation (409)
- Test `list_tags` with task_count calculation
- Test `update_tag` with duplicate name (409)
- Test `delete_tag` CASCADE removes todo_tags

**Consumer Service Unit Tests** (`services/*/tests/`)

**test_recurring_task_handler.py**:
- Test next_occurrence calculation (daily, weekly, monthly)
- Test idempotency check (skip duplicate event_id)
- Test event filtering (only process "completed" events with recurrence)
- Test new task creation with correct fields

**test_notification_handler.py**:
- Test task status verification (skip if completed/deleted)
- Test TaskUpdateEvent publishing
- Test idempotency check

**test_audit_handler.py**:
- Test audit_log insertion
- Test idempotency check (unique event_id constraint)
- Test JSONB task_data storage

**test_websocket_handler.py**:
- Test connection manager (add/remove connections)
- Test broadcast to multiple connections for same user_id
- Test connection cleanup on disconnect

**Frontend Unit Tests** (`frontend/__tests__/`)

**components/SearchBar.test.tsx**:
- Test debouncing (no API call until 300ms after last keystroke)
- Test API call with correct query param

**components/FilterPanel.test.tsx**:
- Test filter state updates
- Test URL param updates
- Test multi-select tag filter

**components/SortControls.test.tsx**:
- Test sort_by dropdown changes
- Test asc/desc toggle
- Test URL param updates

**lib/api.test.ts**:
- Test all API client methods with mock fetch
- Test error handling (401, 404, 500)
- Test JWT token inclusion in headers

**lib/websocket.test.ts**:
- Test WebSocket connection establishment
- Test message handling
- Test auto-reconnect on disconnect

**Test Execution**:
- Backend: `pytest backend/tests/unit/ -v --cov=backend/src --cov-report=html`
- Frontend: `npm test -- --coverage`

**Coverage Target**: 80% line coverage for backend services, 70% for frontend components

---

### Integration Testing

**Backend Integration Tests** (`backend/tests/integration/`)

**test_task_api.py**:
- Test full CRUD flow with real database (use test DB)
- Test authentication (401 without JWT, 403 with wrong user_id)
- Test search/filter/sort with 50+ tasks
- Test event publishing (mock Dapr HTTP endpoint)
- Test tag association (create task with tag_ids)

**test_tag_api.py**:
- Test tag CRUD with real database
- Test unique constraint enforcement
- Test CASCADE delete (verify todo_tags removed)

**test_audit_api.py**:
- Test audit log retrieval with filters
- Test pagination

**test_dapr_endpoints.py**:
- Test `/dapr/subscribe` returns correct metadata
- Test `/reminder-cron` queries and publishes reminders
- Mock Dapr Pub/Sub endpoint to verify event payloads

**Consumer Integration Tests** (`services/*/tests/integration/`)

**test_recurring_task_integration.py**:
- Test full flow: receive CloudEvent, query DB, create task, publish event
- Use test database and mock Dapr endpoints

**test_notification_integration.py**:
- Test full flow: receive CloudEvent, verify task status, publish notification
- Use test database and mock Dapr endpoints

**test_audit_integration.py**:
- Test full flow: receive CloudEvent, insert audit_log, verify idempotency
- Use test database

**test_websocket_integration.py**:
- Test WebSocket connection, receive event, broadcast to clients
- Use WebSocket test client

**Test Execution**:
- Backend: `pytest backend/tests/integration/ -v`
- Consumers: `pytest services/*/tests/integration/ -v`

**Environment**: Use Docker Compose with test database (PostgreSQL) and mock Dapr sidecar

---

### End-to-End Testing

**E2E Test Suite** (`e2e/tests/`)

**test_auth_flow.spec.ts** (Playwright):
- Sign up with new user
- Sign in with credentials
- Verify JWT token stored
- Access protected route
- Sign out and verify redirect

**test_task_crud.spec.ts**:
- Create task with all fields (priority, tags, due date, recurrence)
- Verify task appears in list
- Update task
- Mark complete
- Verify recurring task created (if applicable)
- Delete task

**test_search_filter_sort.spec.ts**:
- Create 20 tasks with varied attributes
- Test search (type query, verify results)
- Test filter (select priority, verify filtered list)
- Test tag filter (select multiple tags)
- Test sort (change sort_by, verify order)
- Test URL persistence (refresh, verify state retained)

**test_tag_management.spec.ts**:
- Create tag
- Edit tag
- Delete tag
- Verify task associations updated

**test_real_time_sync.spec.ts**:
- Open two browser contexts
- Create task in context 1
- Verify task appears in context 2 within 2 seconds

**test_reminders.spec.ts**:
- Create task with due date and reminder
- Fast-forward time (mock system clock or wait)
- Verify notification appears

**Test Execution**:
- `npx playwright test --project=chromium`
- Run against local Minikube deployment

**Coverage**: All user-facing features and critical paths

---

## Phase 4: Deployment Strategy

*GATE: Must pass Phase 3 testing and local validation before cloud deployment.*

### Minikube Deployment (Local)

**Prerequisites**:
- Minikube installed and running (4GB RAM, 4 CPUs)
- Dapr CLI installed (`dapr init -k` completed)
- kubectl configured for Minikube context
- Docker images built and loaded into Minikube
- Neon PostgreSQL database created (free tier)

**Deployment Steps**:
1. Create namespace: `kubectl create namespace todo-app`
2. Create secrets: `kubectl create secret generic db-secrets --from-literal=connection-string="$NEON_URL" -n todo-app`
3. Apply Dapr components: `kubectl apply -f dapr-components/ -n todo-app`
4. Install Helm chart: `helm install todo-app ./helm/todo-app -f ./helm/todo-app/values-local.yaml -n todo-app`
5. Wait for pods: `kubectl wait --for=condition=ready pod --all -n todo-app --timeout=300s`
6. Port forward: `kubectl port-forward svc/frontend 3000:3000 -n todo-app`
7. Access app: http://localhost:3000

**Validation Checklist**:
- [ ] All pods running (2/2 containers)
- [ ] Dapr components healthy (`kubectl get components -n todo-app`)
- [ ] Redpanda pod running (1/1 container)
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API responding at http://localhost:8000/docs
- [ ] Authentication flow works (signup, signin)
- [ ] Task CRUD works with event publishing
- [ ] Recurring task service creates next occurrence
- [ ] Reminder cron triggers every 5 minutes
- [ ] WebSocket real-time sync works
- [ ] Search, filter, sort work correctly
- [ ] Tag CRUD works
- [ ] Audit log populated
- [ ] No errors in any service logs

**Rollback**:
- `helm uninstall todo-app -n todo-app`
- `kubectl delete namespace todo-app`

---

### Cloud Deployment (DOKS/GKE/AKS)

**Prerequisites**:
- Cloud Kubernetes cluster created (DOKS/GKE/AKS)
- kubectl configured for cloud context
- Dapr installed on cluster (`dapr init -k`)
- Redpanda Cloud Serverless cluster created (free tier)
- Container registry configured (Docker Hub, GCR, ACR)
- GitHub repository with Actions enabled
- Secrets configured in GitHub

**Cloud Provider Setup**:

**DigitalOcean DOKS**:
1. Create cluster: `doctl kubernetes cluster create todo-app-cluster --region nyc1 --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=3"`
2. Get kubeconfig: `doctl kubernetes cluster kubeconfig save todo-app-cluster`
3. Install Dapr: `dapr init -k`

**Google Cloud GKE**:
1. Create cluster: `gcloud container clusters create todo-app-cluster --zone us-central1-a --num-nodes=3 --machine-type=e2-medium`
2. Get credentials: `gcloud container clusters get-credentials todo-app-cluster --zone us-central1-a`
3. Install Dapr: `dapr init -k`

**Azure AKS**:
1. Create cluster: `az aks create --resource-group todo-app-rg --name todo-app-cluster --node-count 3 --node-vm-size Standard_B2s`
2. Get credentials: `az aks get-credentials --resource-group todo-app-rg --name todo-app-cluster`
3. Install Dapr: `dapr init -k`

**Redpanda Cloud Setup**:
1. Sign up at https://redpanda.com/cloud
2. Create Serverless cluster (free tier, no credit card)
3. Create topics: `task-events`, `reminders`, `task-updates`
4. Copy bootstrap server URL
5. Create SASL credentials (username, password)

**CI/CD Pipeline** (`.github/workflows/deploy.yml`):
- Build Docker images on push to main
- Push images to container registry
- Configure kubectl with cloud cluster
- Create Kubernetes secrets
- Apply Dapr components (cloud config with Redpanda Cloud)
- Deploy with Helm using values-cloud.yaml
- Run health checks and smoke tests

**Validation Checklist**:
- [ ] All pods running (2/2 containers)
- [ ] Dapr components healthy
- [ ] No Redpanda pod (using Redpanda Cloud)
- [ ] LoadBalancer service has external IP
- [ ] Frontend accessible at external IP
- [ ] Backend API responding
- [ ] Authentication flow works
- [ ] Task CRUD works with event publishing
- [ ] Kafka events flowing to Redpanda Cloud
- [ ] Recurring task service creates next occurrence
- [ ] Reminder cron triggers every 5 minutes
- [ ] WebSocket real-time sync works
- [ ] Search, filter, sort work correctly
- [ ] Tag CRUD works
- [ ] Audit log populated
- [ ] No errors in any service logs
- [ ] Monitoring dashboards show healthy metrics

**Rollback**:
```bash
# Rollback to previous Helm release
helm rollback todo-app -n todo-app

# Or uninstall completely
helm uninstall todo-app -n todo-app
kubectl delete namespace todo-app
```

**Monitoring Setup**:
- Use cloud-native monitoring (GKE: Cloud Monitoring, AKS: Azure Monitor, DOKS: Papertrail)
- Or deploy Prometheus + Grafana
- Configure alerts for pod restarts, HTTP errors, Kafka lag, WebSocket failures
- Aggregate logs with structured JSON format

---

## Risk Analysis

*GATE: Must identify and mitigate top risks before declaring production-ready.*

### Risk 1: Event Duplication Leading to Duplicate Recurring Tasks

**Severity**: HIGH
**Likelihood**: MEDIUM
**Impact**: Users see duplicate tasks created on completion

**Root Cause**:
- Kafka provides at-least-once delivery semantics
- Network failures or consumer restarts can cause duplicate event delivery
- Without idempotency checks, recurring task service creates duplicate tasks

**Mitigation Strategy**:
1. **Implement idempotency checks** (REQUIRED):
   - Store processed event_id in Dapr state store or database
   - Check event_id before processing; skip if already processed
   - Use unique constraint on audit_log.event_id to prevent duplicate audit entries

2. **Use Kafka partition keys**:
   - Partition events by task_id to ensure ordering within a task
   - Prevents race conditions where two "completed" events for same task arrive out of order

3. **Add deduplication window**:
   - Store event_id with TTL (24 hours) in state store
   - After 24 hours, allow reprocessing (for legitimate retries)

4. **Testing**:
   - Simulate duplicate event delivery in integration tests
   - Verify only one recurring task created

**Residual Risk**: LOW (with mitigation implemented)

---

### Risk 2: Dapr Sidecar Failures Blocking Application Requests

**Severity**: HIGH
**Likelihood**: LOW
**Impact**: Application pods healthy but unable to publish events or invoke services

**Root Cause**:
- Dapr sidecar runs as separate container in pod
- If sidecar crashes or becomes unresponsive, app cannot communicate with Dapr
- Application may appear healthy (liveness probe passes) but functionality broken

**Mitigation Strategy**:
1. **Configure Dapr health checks**:
   - Add readiness probe for Dapr sidecar: `http://localhost:3500/v1.0/healthz`
   - Pod marked not ready if Dapr sidecar unhealthy
   - Kubernetes stops routing traffic to unhealthy pods

2. **Implement circuit breakers in application**:
   - Wrap Dapr client calls with timeout (5 seconds)
   - Retry with exponential backoff (3 attempts)
   - Fail gracefully if Dapr unavailable (log error, return 503)

3. **Monitor Dapr sidecar metrics**:
   - Alert on Dapr sidecar restarts > 3 in 10 minutes
   - Alert on Dapr HTTP API latency > 1 second

4. **Set resource limits**:
   - Dapr sidecar memory limit: 256Mi
   - Dapr sidecar CPU limit: 500m
   - Prevents resource starvation

**Residual Risk**: LOW (with monitoring and health checks)

---

### Risk 3: Redpanda Cloud Free Tier Limits Exceeded

**Severity**: MEDIUM
**Likelihood**: MEDIUM
**Impact**: Event publishing fails, features stop working

**Root Cause**:
- Redpanda Cloud Serverless free tier has limits: 10GB storage, 10MB/s throughput
- High event volume (many users, frequent task operations) can exceed limits
- No graceful degradation if limits hit

**Mitigation Strategy**:
1. **Implement event batching**:
   - Batch TaskUpdateEvents (real-time sync) to reduce message count
   - Publish one event per user per second (aggregate multiple task changes)

2. **Set retention policies**:
   - task-events: 7 days retention (audit_log is source of truth)
   - reminders: 1 day retention (one-time delivery)
   - task-updates: 1 hour retention (real-time only)

3. **Monitor Kafka metrics**:
   - Alert on storage usage > 8GB (80% of limit)
   - Alert on throughput > 8MB/s (80% of limit)
   - Dashboard showing message rate per topic

4. **Fallback plan**:
   - If limits exceeded, disable real-time sync (task-updates topic)
   - Core features (CRUD, recurring tasks, reminders) still work
   - Notify users of degraded service

5. **Upgrade path**:
   - Document upgrade to paid tier ($0.50/GB storage, $0.10/GB egress)
   - Estimated cost for 1000 users: ~$10/month

**Residual Risk**: LOW (with monitoring and fallback plan)

---

### Risk 4: Database Connection Pool Exhaustion in Serverless Environment

**Severity**: MEDIUM
**Likelihood**: MEDIUM
**Impact**: API requests fail with "too many connections" error

**Root Cause**:
- Neon Serverless PostgreSQL free tier: 100 concurrent connections
- 6 services (backend, 4 consumers, websocket) each with connection pools
- Default pool size (10 per service) = 60 connections
- Kubernetes pod restarts or scaling can temporarily double connection count

**Mitigation Strategy**:
1. **Configure connection pooling**:
   - Backend: max 20 connections (high traffic)
   - Each consumer: max 5 connections (low traffic)
   - WebSocket: max 5 connections (read-only queries)
   - Total: 45 connections (45% of limit)

2. **Use pgbouncer** (connection pooler):
   - Deploy pgbouncer as sidecar or separate service
   - Pool mode: transaction (releases connection after each transaction)
   - Reduces actual database connections to ~10

3. **Implement connection retry logic**:
   - Retry on "too many connections" error (3 attempts, exponential backoff)
   - Fail gracefully with 503 if all retries exhausted

4. **Monitor connection count**:
   - Query `SELECT count(*) FROM pg_stat_activity` every minute
   - Alert if connections > 80 (80% of limit)

5. **Graceful shutdown**:
   - Close database connections on SIGTERM (Kubernetes pod termination)
   - PreStop hook: sleep 5 seconds to drain connections

**Residual Risk**: LOW (with pgbouncer and monitoring)

---

### Risk 5: WebSocket Connection Storms on Deployment

**Severity**: MEDIUM
**Likelihood**: HIGH
**Impact**: WebSocket service overwhelmed, connections dropped

**Root Cause**:
- Rolling deployment restarts WebSocket pods
- All connected clients (potentially 100+ per user) reconnect simultaneously
- WebSocket service receives connection storm, CPU/memory spike

**Mitigation Strategy**:
1. **Implement exponential backoff reconnect**:
   - Client waits random(1-5) seconds before first reconnect
   - Double wait time on each failure (max 60 seconds)
   - Spreads reconnections over time

2. **Configure rolling update strategy**:
   - maxUnavailable: 1 (only one pod down at a time)
   - maxSurge: 1 (one extra pod during rollout)
   - Ensures capacity during deployment

3. **Set resource limits**:
   - WebSocket service: 512Mi memory, 500m CPU
   - Horizontal Pod Autoscaler: scale up if CPU > 70%

4. **Implement connection rate limiting**:
   - Max 10 connections per user_id
   - Reject new connections if limit exceeded (return 429)

5. **Health check grace period**:
   - Readiness probe initial delay: 10 seconds
   - Gives service time to warm up before receiving traffic

**Residual Risk**: LOW (with backoff and rate limiting)

---

### Risk 6: Cron Binding Triggers Missing Due to Pod Restarts

**Severity**: LOW
**Likelihood**: MEDIUM
**Impact**: Reminders delayed by up to 5 minutes

**Root Cause**:
- Dapr cron binding triggers every 5 minutes
- If backend pod restarts during trigger window, trigger missed
- Next trigger in 5 minutes (max 10 minute delay)

**Mitigation Strategy**:
1. **Reduce cron interval** (if acceptable):
   - Change from `*/5 * * * *` to `*/2 * * * *` (every 2 minutes)
   - Reduces max delay from 10 minutes to 4 minutes

2. **Deploy multiple backend replicas**:
   - Set backend.replicas: 2 in Helm values
   - Cron binding triggers all replicas (idempotency prevents duplicates)
   - If one pod down, other still receives trigger

3. **Add startup check**:
   - On backend startup, query for overdue reminders (remind_at < NOW())
   - Publish missed reminders immediately
   - Catches reminders missed during downtime

4. **Monitor cron execution**:
   - Log every cron trigger execution with timestamp
   - Alert if no cron execution in 10 minutes

**Residual Risk**: VERY LOW (reminders delayed but not lost)

---

### Risk 7: Helm Chart Configuration Drift Between Environments

**Severity**: LOW
**Likelihood**: MEDIUM
**Impact**: Local deployment works, cloud deployment fails

**Root Cause**:
- values-local.yaml and values-cloud.yaml diverge over time
- Developer tests locally but forgets to update cloud values
- CI/CD deploys with incorrect configuration

**Mitigation Strategy**:
1. **Use Helm chart testing**:
   - `helm lint ./helm/todo-app` in CI pipeline
   - `helm template ./helm/todo-app -f values-local.yaml` to verify rendering
   - `helm template ./helm/todo-app -f values-cloud.yaml` to verify rendering

2. **Document required overrides**:
   - Add comments in values-cloud.yaml explaining each override
   - README section: "Local vs Cloud Configuration Differences"

3. **Automated validation**:
   - CI job: compare values-local.yaml and values-cloud.yaml
   - Fail if critical fields missing (image, replicas, dapr.enabled)

4. **Dry-run deployments**:
   - `helm upgrade --install --dry-run` in CI before actual deployment
   - Catches template errors before production

**Residual Risk**: VERY LOW (with CI validation)

---

## Success Criteria

*GATE: All criteria must be met before declaring Phase V complete.*

### Functional Success Criteria

**Authentication & Authorization**:
- [ ] User can sign up with email and password
- [ ] User can sign in and receive JWT token
- [ ] JWT token validated on all protected endpoints
- [ ] User can only access their own data (no cross-user data leakage)
- [ ] User can sign out and token invalidated

**Core Task Management**:
- [ ] User can create task with title, description, priority, tags, due date, reminder, recurrence
- [ ] User can view task list with all attributes displayed
- [ ] User can update task (all fields editable)
- [ ] User can mark task complete/incomplete
- [ ] User can delete task (soft delete)
- [ ] Deleted tasks not shown in list

**Advanced Features - Recurring Tasks**:
- [ ] User can set recurrence pattern (daily, weekly, monthly) with interval
- [ ] When recurring task marked complete, next occurrence auto-created within 5 seconds
- [ ] Next occurrence has correct due date (today + interval)
- [ ] Next occurrence inherits title, description, priority, tags, recurrence settings
- [ ] Original task marked complete, new task created as pending

**Advanced Features - Due Dates & Reminders**:
- [ ] User can set due date on task
- [ ] User can set reminder time (must be before due date)
- [ ] Cron binding triggers every 5 minutes
- [ ] Reminders published for tasks with remind_at within next 5 minutes
- [ ] In-app notification appears in frontend within 2 seconds of reminder trigger
- [ ] Reminder only sent if task still pending (not completed or deleted)

**Advanced Features - Priorities**:
- [ ] User can set priority (Low, Medium, High) on task
- [ ] Priority badge displayed with correct color (Low=green, Medium=blue, High=red)
- [ ] User can filter tasks by priority
- [ ] User can sort tasks by priority (ascending/descending)

**Advanced Features - Tags**:
- [ ] User can create tag with name and color
- [ ] User can assign multiple tags to task
- [ ] User can filter tasks by one or more tags (AND logic)
- [ ] User can edit tag (rename, change color)
- [ ] User can delete tag (removes associations, tasks not deleted)
- [ ] Tag names unique per user (409 error on duplicate)
- [ ] Tag list shows task_count for each tag

**Advanced Features - Search**:
- [ ] User can search tasks by text query
- [ ] Search matches title and description (case-insensitive)
- [ ] Search debounced (no API call until 300ms after last keystroke)
- [ ] Search results displayed within 1 second for 100+ tasks

**Advanced Features - Filter**:
- [ ] User can filter by status (pending, completed)
- [ ] User can filter by priority (Low, Medium, High)
- [ ] User can filter by tags (multi-select)
- [ ] User can filter by due date range (from_date, to_date)
- [ ] Multiple filters combine with AND logic
- [ ] Filter state persisted in URL query params
- [ ] Filter state restored on page refresh

**Advanced Features - Sort**:
- [ ] User can sort by created_at, due_date, priority, title
- [ ] User can toggle ascending/descending
- [ ] Sort state persisted in URL query params
- [ ] Sort state restored on page refresh

**Advanced Features - Audit Log**:
- [ ] User can view audit log of all task operations
- [ ] Audit entries show event_type, task snapshot, timestamp
- [ ] User can filter audit log by event_type (created, updated, completed, deleted)
- [ ] User can filter audit log by date range
- [ ] Audit log paginated (20 entries per page)

**Advanced Features - Real-Time Sync**:
- [ ] User opens dashboard in two browser tabs
- [ ] Task created in tab 1 appears in tab 2 within 2 seconds
- [ ] Task updated in tab 1 updates in tab 2 within 2 seconds
- [ ] Task deleted in tab 1 removed from tab 2 within 2 seconds
- [ ] WebSocket connection auto-reconnects on disconnect

---

### Technical Success Criteria

**Event-Driven Architecture**:
- [ ] All task operations (create, update, complete, delete) publish TaskEvent to task-events topic
- [ ] Tasks with due dates publish ReminderEvent to reminders topic
- [ ] All task operations publish TaskUpdateEvent to task-updates topic
- [ ] Recurring Task Service subscribes to task-events and creates next occurrence
- [ ] Notification Service subscribes to reminders and publishes notifications
- [ ] Audit Service subscribes to task-events and stores audit log
- [ ] WebSocket Service subscribes to task-updates and broadcasts to clients
- [ ] All consumers implement idempotency checks (skip duplicate event_id)

**Dapr Integration**:
- [ ] All services run with Dapr sidecar (2/2 containers in pod)
- [ ] Backend publishes events via Dapr HTTP API (POST to localhost:3500)
- [ ] Consumers subscribe via Dapr programmatic subscription (GET /dapr/subscribe)
- [ ] Dapr Pub/Sub component (kafka-pubsub) configured and healthy
- [ ] Dapr State Store component (statestore) configured and healthy
- [ ] Dapr Cron Binding component (reminder-cron) configured and triggers every 5 minutes
- [ ] Dapr Secrets component (kubernetes-secrets) configured and accessible
- [ ] Frontend uses Dapr Service Invocation to call backend (via localhost:3500)

**Kubernetes Deployment**:
- [ ] All 6 services deployed as Kubernetes Deployments
- [ ] All pods running with 2/2 containers (app + Dapr sidecar)
- [ ] All services exposed via ClusterIP Services
- [ ] Namespace created (todo-app)
- [ ] Secrets created (db-secrets, kafka-secrets)
- [ ] Dapr components applied and healthy
- [ ] Helm chart installs successfully with one command
- [ ] Helm chart supports values overrides (local vs cloud)

**Local Deployment (Minikube)**:
- [ ] Minikube cluster running with 4GB RAM, 4 CPUs
- [ ] Dapr installed on Minikube (`dapr init -k`)
- [ ] Redpanda Docker container running as Kafka replacement
- [ ] All services deployed and healthy
- [ ] End-to-end validation passes (all functional criteria)
- [ ] No errors in any service logs

**Cloud Deployment (DOKS/GKE/AKS)**:
- [ ] Kubernetes cluster created on cloud provider
- [ ] Dapr installed on cloud cluster
- [ ] Redpanda Cloud Serverless cluster created (free tier)
- [ ] Kafka topics created (task-events, reminders, task-updates)
- [ ] CI/CD pipeline configured (GitHub Actions)
- [ ] Pipeline builds Docker images on push to main
- [ ] Pipeline pushes images to container registry
- [ ] Pipeline deploys to Kubernetes with Helm
- [ ] Pipeline runs health checks and smoke tests
- [ ] LoadBalancer service has external IP
- [ ] Frontend accessible at external IP
- [ ] End-to-end validation passes (all functional criteria)

**Performance**:
- [ ] Task list API: p95 latency < 500ms for 100 concurrent users
- [ ] Search API: p95 latency < 1 second for 100+ tasks
- [ ] Event publishing: 100 events/second sustained throughput
- [ ] Recurring task creation: < 5 seconds after completion event
- [ ] Reminder delivery: within 5 minutes of scheduled time
- [ ] WebSocket broadcast: < 2 seconds to 100 connected clients
- [ ] Database connection pool: < 80% utilization under load

**Security**:
- [ ] Passwords hashed with bcrypt (never stored plain text)
- [ ] JWT tokens validated on all protected endpoints
- [ ] User ID extracted from JWT and used for data filtering
- [ ] No cross-user data leakage (verified with test users)
- [ ] SQL injection prevented (parameterized queries only)
- [ ] XSS prevented (input sanitized in frontend)
- [ ] CORS configured for frontend origin only
- [ ] Secrets stored in Kubernetes Secrets (not hardcoded)
- [ ] Dapr mTLS enabled for inter-service communication
- [ ] Kubernetes RBAC configured for cluster access

**Testing**:
- [ ] Unit tests: 80% line coverage for backend, 70% for frontend
- [ ] Integration tests: all API endpoints covered
- [ ] E2E tests: all user flows covered (Playwright)
- [ ] Dapr component tests: all building blocks verified
- [ ] Performance tests: load tests pass acceptance criteria
- [ ] All tests pass in CI pipeline

**Documentation**:
- [ ] README with setup instructions (Minikube and cloud)
- [ ] API documentation (OpenAPI/Swagger auto-generated)
- [ ] Kafka event schemas documented (data-model.md)
- [ ] Dapr components documented (inline comments in YAML)
- [ ] Helm chart values documented (comments in values.yaml)
- [ ] Architecture diagrams (services, event flow, deployment)
- [ ] Troubleshooting guide (common issues and solutions)

---

## Dependencies and Blockers

*GATE: Must resolve all blockers before implementation can proceed.*

### External Dependencies

**1. Neon Serverless PostgreSQL (Free Tier)**
- **Status**: AVAILABLE
- **Requirement**: Database for users, tasks, tags, audit log
- **Free Tier Limits**: 10GB storage, 100 concurrent connections
- **Setup Time**: 5 minutes (create project, copy connection string)
- **Risk**: LOW (free tier sufficient for development and testing)
- **Mitigation**: Monitor storage usage; upgrade to paid tier if needed ($19/month)

**2. Redpanda Cloud Serverless (Free Tier)**
- **Status**: AVAILABLE
- **Requirement**: Kafka-compatible event streaming for cloud deployment
- **Free Tier Limits**: 10GB storage, 10MB/s throughput, no credit card required
- **Setup Time**: 10 minutes (sign up, create cluster, create topics, copy credentials)
- **Risk**: MEDIUM (free tier limits may be exceeded with high usage)
- **Mitigation**: Implement event batching, set retention policies, monitor usage

**3. Cloud Kubernetes Provider (DOKS/GKE/AKS)**
- **Status**: AVAILABLE (choose one)
- **Requirement**: Managed Kubernetes for cloud deployment
- **Free Tier Credits**:
  - DigitalOcean: $200 for 60 days
  - Google Cloud: $300 for 90 days
  - Azure: $200 for 30 days + 12 months free services
- **Setup Time**: 15 minutes (create account, create cluster, configure kubectl)
- **Risk**: LOW (credits sufficient for Phase V development)
- **Mitigation**: Monitor credit usage; shut down cluster when not in use

**4. Container Registry (Docker Hub / GCR / ACR)**
- **Status**: AVAILABLE
- **Requirement**: Store Docker images for CI/CD pipeline
- **Free Tier**: Docker Hub (unlimited public repos, 1 private repo)
- **Setup Time**: 5 minutes (create account, configure credentials)
- **Risk**: VERY LOW (free tier sufficient)
- **Mitigation**: Use public repos for open-source project; upgrade if private repos needed

**5. GitHub Actions**
- **Status**: AVAILABLE
- **Requirement**: CI/CD pipeline for automated deployment
- **Free Tier**: 2000 minutes/month for public repos, 500 minutes/month for private repos
- **Setup Time**: 30 minutes (write workflow YAML, configure secrets)
- **Risk**: LOW (free tier sufficient for Phase V)
- **Mitigation**: Optimize workflow to reduce build time; use self-hosted runners if needed

---

### Internal Dependencies

**1. Phase III Codebase (Existing Todo App)**
- **Status**: COMPLETE (assumed)
- **Requirement**: Working Next.js frontend, FastAPI backend, Better Auth integration
- **Dependency**: Phase V extends Phase III; cannot start without base app
- **Risk**: LOW (Phase III already complete per project context)
- **Blocker**: If Phase III incomplete, must finish before Phase V

**2. Database Schema Migration**
- **Status**: PENDING (Phase 2.1)
- **Requirement**: Extend Task model, create Tag, TodoTag, AuditLog tables
- **Dependency**: Backend API (Phase 2.3) depends on schema
- **Risk**: LOW (straightforward schema extension)
- **Blocker**: Must complete before backend API implementation

**3. Dapr Client Implementation**
- **Status**: PENDING (Phase 2.2)
- **Requirement**: HTTP client for Dapr Pub/Sub, State, Secrets APIs
- **Dependency**: Backend API (Phase 2.3) and all consumers (Phase 2.4) depend on Dapr client
- **Risk**: LOW (simple HTTP wrapper around Dapr API)
- **Blocker**: Must complete before event publishing or consuming

**4. API Contract Definitions**
- **Status**: COMPLETE (contracts/ directory)
- **Requirement**: OpenAPI specs for tasks, tags, audit, Dapr subscriptions
- **Dependency**: Backend implementation must match contracts
- **Risk**: VERY LOW (contracts already defined)
- **Blocker**: None (contracts complete)

**5. Helm Chart Templates**
- **Status**: PENDING (Phase 2.6)
- **Requirement**: Kubernetes manifests for all 6 services with Dapr annotations
- **Dependency**: Local deployment (Phase 2.7) and cloud deployment (Phase 4) depend on Helm chart
- **Risk**: MEDIUM (Helm templating can be complex)
- **Blocker**: Must complete before any Kubernetes deployment

---

### Technical Blockers

**1. Dapr Learning Curve**
- **Issue**: Team may be unfamiliar with Dapr concepts (sidecars, components, building blocks)
- **Impact**: Slower implementation, potential misconfigurations
- **Mitigation**:
  - Complete Dapr quickstarts (https://docs.dapr.io/getting-started/)
  - Test Dapr standalone mode locally before Kubernetes
  - Use `event-driven-infra-expert` agent for Dapr-specific tasks
- **Timeline**: 2-4 hours learning time before Phase 2.2

**2. Kubernetes Manifest Complexity**
- **Issue**: Helm charts with Dapr annotations, secrets, and multiple services can be error-prone
- **Impact**: Deployment failures, debugging time
- **Mitigation**:
  - Start with simple manifests, add complexity incrementally
  - Use `helm lint` and `helm template --dry-run` to catch errors early
  - Test on Minikube before cloud deployment
  - Use `dapr-cloud-deployer` agent for Helm chart creation
- **Timeline**: Expect 1-2 iterations to get Helm chart working

**3. Event Idempotency Implementation**
- **Issue**: Ensuring consumers handle duplicate events correctly requires careful design
- **Impact**: Duplicate recurring tasks, duplicate audit entries
- **Mitigation**:
  - Implement idempotency checks in Phase 2.4 (before any consumer logic)
  - Use unique constraint on audit_log.event_id
  - Test with simulated duplicate events in integration tests
- **Timeline**: Add 20% time buffer to Phase 2.4 for idempotency testing

**4. WebSocket Connection Management**
- **Issue**: Managing WebSocket connections across pod restarts and scaling
- **Impact**: Dropped connections, missed real-time updates
- **Mitigation**:
  - Implement client-side auto-reconnect with exponential backoff
  - Use sticky sessions (session affinity) in Kubernetes Service
  - Test reconnection logic in E2E tests
- **Timeline**: Add 1 day for WebSocket reconnection testing

---

### Resource Blockers

**1. Minikube Resource Requirements**
- **Issue**: Minikube requires 4GB RAM, 4 CPUs; may not be available on all dev machines
- **Impact**: Cannot test locally, must deploy to cloud for testing (slower iteration)
- **Mitigation**:
  - Use cloud-based development environment (GitHub Codespaces, Gitpod)
  - Reduce Minikube resource requirements (3GB RAM, 2 CPUs) with fewer replicas
  - Use Dapr standalone mode for initial testing (no Kubernetes required)
- **Timeline**: Resolve before Phase 2.7

**2. Cloud Provider Credits Exhaustion**
- **Issue**: Free tier credits may run out before Phase V complete
- **Impact**: Cannot deploy to cloud, cannot test production environment
- **Mitigation**:
  - Shut down cluster when not actively testing
  - Use Minikube for most testing, cloud only for final validation
  - Choose provider with longest credit duration (GKE: 90 days)
  - Monitor credit usage daily
- **Timeline**: Track throughout Phase V

---

### Coordination Blockers

**1. Multi-Agent Workflow Coordination**
- **Issue**: Phase V requires 8+ specialized agents in sequence; handoffs can be error-prone
- **Impact**: Misaligned implementations, rework required
- **Mitigation**:
  - Use `/sp.tasks` to break work into clear, atomic tasks
  - Each task specifies input artifacts and output artifacts
  - Validate outputs before moving to next agent
  - Use `local-stack-validator` agent after each phase for integration testing
- **Timeline**: Add 10% time buffer for agent coordination

**2. Contract Drift Between Services**
- **Issue**: Backend API and consumers must agree on event schemas; drift causes runtime errors
- **Impact**: Events published but not consumed, or consumed incorrectly
- **Mitigation**:
  - Use contracts/ as single source of truth for event schemas
  - Generate Pydantic models from OpenAPI specs (code generation)
  - Integration tests verify event schema compliance
  - Version event schemas (add version field to CloudEvent)
- **Timeline**: Add schema validation to Phase 2.3 and 2.4

---

### Decision Blockers

**1. Cloud Provider Selection (DOKS vs GKE vs AKS)**
- **Issue**: Must choose one provider for Phase V; each has tradeoffs
- **Impact**: Cannot proceed with cloud deployment (Phase 4) until decided
- **Options**:
  - **DigitalOcean DOKS**: Simplest, best docs, $200/60 days
  - **Google Cloud GKE**: Most features, best free tier ($300/90 days), steeper learning curve
  - **Azure AKS**: Good integration with GitHub Actions, $200/30 days (shortest duration)
- **Recommendation**: GKE (longest credit duration, best for learning)
- **Decision Required By**: Before Phase 2.6 (Helm chart cloud values)

**2. Monitoring Solution (Prometheus vs Cloud-Native)**
- **Issue**: Must choose monitoring approach for cloud deployment
- **Impact**: Cannot set up alerts and dashboards until decided
- **Options**:
  - **Prometheus + Grafana**: Portable, open-source, requires setup
  - **Cloud-native** (GKE: Cloud Monitoring, AKS: Azure Monitor, DOKS: Papertrail): Integrated, easier setup, vendor lock-in
- **Recommendation**: Cloud-native for Phase V (faster setup); migrate to Prometheus later if needed
- **Decision Required By**: Before Phase 4 (cloud deployment)

**3. Container Registry (Docker Hub vs Cloud Provider Registry)**
- **Issue**: Must choose where to store Docker images for CI/CD
- **Impact**: Cannot configure GitHub Actions workflow until decided
- **Options**:
  - **Docker Hub**: Free, simple, public repos
  - **GCR/ACR**: Integrated with cloud provider, private repos, faster pulls
- **Recommendation**: Docker Hub for Phase V (free, simple); migrate to cloud registry if needed
- **Decision Required By**: Before Phase 4 (CI/CD pipeline)

---

### Acceptance Gate

**All blockers must be resolved before proceeding to implementation**:
- [ ] Neon PostgreSQL database created and connection string obtained
- [ ] Redpanda Cloud cluster created (or decision to defer cloud deployment)
- [ ] Cloud provider selected (DOKS/GKE/AKS) and account created
- [ ] Container registry selected and credentials configured
- [ ] GitHub Actions enabled and secrets configured
- [ ] Minikube installed and running (or alternative dev environment)
- [ ] Dapr CLI installed and tested locally
- [ ] Phase III codebase available and working
- [ ] All agents available (`neon-db-expert`, `backend-engineer`, `event-driven-infra-expert`, etc.)
- [ ] Team familiar with Dapr concepts (completed quickstarts)
- [ ] Monitoring solution selected
- [ ] All technical decisions documented

---

**END OF PLAN**
