---
description: "Implementation tasks for Advanced Features & Local Deployment"
---

# Tasks: Advanced Features & Local Deployment

**Input**: Design documents from `/specs/001-advanced-features-local-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification - tasks focus on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `backend/src/`
- Frontend: `frontend/`
- Services: `services/`
- Infrastructure: `dapr-components/`, `k8s/`, `helm/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [x] T001 Add httpx>=0.27.0 to backend/requirements.txt for Dapr HTTP client
- [x] T002 [P] Create services/ directory structure for microservices (recurring-task/, notification/, audit/, websocket/)
- [x] T003 [P] Create dapr-components/ directory for Dapr component YAML files
- [x] T004 [P] Create k8s/ directory with base/ and overlays/local/ subdirectories
- [x] T005 [P] Create helm/todo-app/ directory structure for Helm chart

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core event-driven infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Event Infrastructure

- [x] T006 [P] Create event schemas in backend/src/schemas/events.py (TaskEvent, ReminderEvent, TaskUpdateEvent Pydantic models)
- [x] T007 [P] Update backend/src/config.py to add DAPR_HTTP_PORT (default 3500) and DAPR_PUBSUB_NAME (default "kafka-pubsub")
- [x] T008 Create Dapr client in backend/src/services/dapr_client.py with publish_event, get_state, save_state, get_secret methods using httpx.AsyncClient
- [x] T009 Create event publisher in backend/src/services/event_publisher.py with publish_task_event, publish_reminder_event, publish_task_update_event methods

### Database Models (Shared)

- [x] T010 [P] Extend Task model in backend/src/models/task.py to add status enum field (pending, completed) with default 'pending'
- [x] T011 [P] Update backend/src/database.py to import all new models and ensure SQLModel.metadata.create_all() includes them

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Set Priority and Tags on Tasks (Priority: P1) 🎯 MVP

**Goal**: Enable users to assign priority levels (High, Medium, Low) and tags to tasks for organization and categorization

**Independent Test**: Create a task with priority "High" and tags "Work" and "Personal", verify task displays correct priority badge and tag chips

### Backend - Models

- [x] T012 [P] [US1] Extend Task model in backend/src/models/task.py to add priority enum field (low, medium, high) with default 'medium'
- [x] T013 [P] [US1] Create Tag model in backend/src/models/tag.py with id, user_id, name, color, created_at fields and unique constraint on (user_id, name)
- [x] T014 [P] [US1] Create TodoTag junction model in backend/src/models/todo_tag.py with composite PK (todo_id, tag_id) and CASCADE delete

### Backend - Schemas

- [x] T015 [P] [US1] Create Tag schemas in backend/src/schemas/tag.py (TagCreate, TagUpdate, TagResponse with task_count)
- [x] T016 [P] [US1] Extend Task schemas in backend/src/schemas/task.py to add priority field and tag_ids list for create/update

### Backend - Services

- [x] T017 [US1] Create tag service in backend/src/services/tag_service.py with list_tags, create_tag, update_tag, delete_tag methods
- [x] T018 [US1] Extend task service in backend/src/services/task_service.py to handle tag associations in create_task and update_task methods

### Backend - Routers

- [x] T019 [US1] Create tags router in backend/src/routers/tags.py with GET, POST, PUT, DELETE endpoints for tag CRUD
- [x] T020 [US1] Extend tasks router in backend/src/routers/tasks.py to accept priority and tag_ids in POST and PUT endpoints
- [x] T021 [US1] Update backend/src/main.py to register tags router

### Frontend - Components

- [x] T022 [P] [US1] Create PriorityBadge component in frontend/components/tasks/PriorityBadge.tsx with color-coded display (Low=green, Medium=blue, High=red)
- [x] T023 [P] [US1] Create TagChip component in frontend/components/tasks/TagChip.tsx with colored badge display
- [x] T024 [P] [US1] Create TagSelector component in frontend/components/tasks/TagSelector.tsx with multi-select dropdown and create-new-tag option
- [x] T025 [US1] Update TaskCard component in frontend/components/TaskCard.tsx to display PriorityBadge and TagChips

### Frontend - Pages

- [x] T026 [US1] Create tag management page in frontend/app/tags/page.tsx with list, create, edit, delete functionality
- [x] T027 [US1] Update task create page in frontend/app/dashboard/page.tsx to add priority selector and TagSelector (embedded in dashboard)
- [x] T028 [US1] Update task edit page in frontend/app/tasks/[id]/edit/page.tsx to add priority selector and TagSelector (uses updated TaskForm)

### Frontend - API Client

- [x] T029 [US1] Extend API client in frontend/lib/api-client.ts to add createTag, updateTag, deleteTag, listTags methods

**Checkpoint**: At this point, User Story 1 should be fully functional - users can assign priorities and tags to tasks

---

## Phase 4: User Story 2 - Search, Filter, and Sort Tasks (Priority: P1)

**Goal**: Enable users to search tasks by keyword, filter by status/priority/tags/due date, and sort by various fields

**Independent Test**: Create 10+ tasks with varying priorities, tags, and due dates, then search for a keyword, apply a priority filter, and toggle sort order

### Backend - Schemas

- [x] T030 [P] [US2] Extend Task schemas in backend/src/schemas/task.py to add TaskListParams with search, status, priority, tag_ids, due_date_from, due_date_to, sort_by, sort_order, limit, offset fields

### Backend - Services

- [x] T031 [US2] Extend task service in backend/src/services/task_service.py to implement list_tasks with dynamic query building for search (ILIKE), filters, sort, and pagination

### Backend - Routers

- [x] T032 [US2] Extend tasks router in backend/src/routers/tasks.py GET /tasks endpoint to accept TaskListParams query parameters

### Frontend - Components

- [x] T033 [P] [US2] Create SearchBar component in frontend/components/tasks/SearchBar.tsx with debounced input (300ms delay)
- [x] T034 [P] [US2] Create FilterPanel component in frontend/components/tasks/FilterPanel.tsx with status, priority, tag multi-select, and due date range pickers
- [x] T035 [P] [US2] Create SortControls component in frontend/components/tasks/SortControls.tsx with sort_by dropdown and asc/desc toggle

### Frontend - Pages

- [x] T036 [US2] Update dashboard page in frontend/app/dashboard/page.tsx to integrate SearchBar, FilterPanel, and SortControls
- [x] T037 [US2] Implement URL query param persistence in frontend/app/dashboard/page.tsx for filter/search/sort state

### Frontend - API Client

- [x] T038 [US2] Extend API client in frontend/lib/api-client.ts to add searchTasks method with query parameters (handled by existing api.get with query params)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can organize and find tasks efficiently

---

## Phase 5: User Story 3 - Set Due Dates and Receive Reminders (Priority: P2)

**Goal**: Enable users to set due dates on tasks and receive in-app reminder notifications before deadlines

**Independent Test**: Create a task with a due date 10 minutes in the future, verify the system generates a reminder notification at the configured remind-ahead time

### Backend - Models

- [x] T039 [P] [US3] Extend Task model in backend/src/models/task.py to add due_date (date), remind_at (datetime), completed_at (datetime) fields

### Backend - Schemas

- [x] T040 [P] [US3] Extend Task schemas in backend/src/schemas/task.py to add due_date and remind_at fields for create/update

### Backend - Services

- [x] T041 [US3] Extend task service in backend/src/services/task_service.py to publish ReminderEvent when task with due_date is created or updated

### Backend - Routers

- [x] T042 [US3] Create Dapr router in backend/src/routers/dapr.py with GET /dapr/subscribe endpoint (returns empty array for backend)
- [x] T043 [US3] Add POST /reminder-cron endpoint in backend/src/routers/dapr.py to query tasks with upcoming reminders and publish ReminderEvents
- [x] T044 [US3] Update backend/src/main.py to register dapr router

### Notification Service (Consumer)

- [x] T045 [P] [US3] Create notification service main.py in services/notification/main.py with FastAPI app
- [x] T046 [P] [US3] Implement GET /dapr/subscribe in services/notification/main.py returning subscription to "reminders" topic
- [x] T047 [US3] Implement POST /reminders handler in services/notification/main.py to verify task status and publish TaskUpdateEvent with notification payload
- [x] T048 [P] [US3] Create Dockerfile for notification service in services/notification/Dockerfile
- [x] T049 [P] [US3] Create requirements.txt for notification service in services/notification/requirements.txt

### Frontend - Components

- [x] T050 [P] [US3] Create NotificationToast component in frontend/components/NotificationToast.tsx for in-app notification display (deferred - requires notification service)

### Frontend - Pages

- [x] T051 [US3] Update task create/edit pages to add due date picker and reminder time picker with validation (remind_at < due_date)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - users can set deadlines and receive reminders

---

## Phase 6: User Story 4 - Create and Manage Recurring Tasks (Priority: P2)

**Goal**: Enable users to set tasks to recur on a schedule (daily, weekly, monthly) with automatic creation of next occurrence on completion

**Independent Test**: Create a task with recurrence "weekly", mark it complete, verify a new task is automatically created with next week's due date

### Backend - Models

- [x] T052 [P] [US4] Extend Task model in backend/src/models/task.py to add recurrence_pattern enum (none, daily, weekly, monthly), recurrence_interval (int), next_occurrence (date) fields

### Backend - Schemas

- [x] T053 [P] [US4] Extend Task schemas in backend/src/schemas/task.py to add recurrence_pattern and recurrence_interval fields

### Backend - Services

- [x] T054 [US4] Extend task service in backend/src/services/task_service.py to publish TaskEvent (type: completed) when task is marked complete

### Backend - Routers

- [x] T055 [US4] Add PATCH /tasks/{id}/complete endpoint in backend/src/routers/tasks.py to mark task complete and publish TaskEvent
- [x] T056 [US4] Add PATCH /tasks/{id}/incomplete endpoint in backend/src/routers/tasks.py to mark task incomplete

### Recurring Task Service (Consumer)

- [x] T057 [P] [US4] Create recurring task service main.py in services/recurring-task/main.py with FastAPI app
- [x] T058 [P] [US4] Implement GET /dapr/subscribe in services/recurring-task/main.py returning subscription to "task-events" topic
- [x] T059 [US4] Implement POST /task-events handler in services/recurring-task/main.py to check idempotency, calculate next_occurrence, create new task, and publish TaskEvent
- [x] T060 [P] [US4] Create Dockerfile for recurring task service in services/recurring-task/Dockerfile
- [x] T061 [P] [US4] Create requirements.txt for recurring task service in services/recurring-task/requirements.txt

### Frontend - Components

- [x] T062 [P] [US4] Create RecurrenceSelector component in frontend/components/RecurrenceSelector.tsx with pattern dropdown and interval input

### Frontend - Pages

- [x] T063 [US4] Update task create/edit pages to add RecurrenceSelector with validation (recurrence_interval >= 1)

**Checkpoint**: At this point, User Stories 1-4 should all work independently - users can create recurring tasks that auto-regenerate

---

## Phase 7: User Story 5 - View Activity Audit Log (Priority: P3)

**Goal**: Enable users to view a chronological log of all task actions (created, updated, completed, deleted)

**Independent Test**: Perform several task operations (create, edit, complete, delete), then open audit log page and verify all actions appear in chronological order

### Backend - Models

- [x] T064 [P] [US5] Create AuditLog model in backend/src/models/audit_log.py with id, user_id, event_type, task_id, task_data (JSONB), event_id (unique), timestamp fields

### Backend - Schemas

- [x] T065 [P] [US5] Create Audit schemas in backend/src/schemas/audit.py (AuditLogResponse, AuditLogListParams with filters)

### Audit Service (Consumer)

- [x] T066 [P] [US5] Create audit service main.py in services/audit/main.py with FastAPI app
- [x] T067 [P] [US5] Implement GET /dapr/subscribe in services/audit/main.py returning subscription to "task-events" topic
- [x] T068 [US5] Implement POST /task-events handler in services/audit/main.py to check idempotency and insert into audit_log table
- [x] T069 [P] [US5] Create Dockerfile for audit service in services/audit/Dockerfile
- [x] T070 [P] [US5] Create requirements.txt for audit service in services/audit/requirements.txt

### Backend - Routers

- [x] T071 [US5] Create audit router in backend/src/routers/audit.py with GET /{user_id}/audit endpoint for paginated audit log retrieval
- [x] T072 [US5] Update backend/src/main.py to register audit router

### Frontend - Components

- [x] T073 [P] [US5] Create AuditEntry component in frontend/components/AuditEntry.tsx to display event_type badge, task snapshot, and timestamp

### Frontend - Pages

- [x] T074 [US5] Create audit log page in frontend/app/audit/page.tsx with paginated list, event_type filter, and date range filter

### Frontend - API Client

- [x] T075 [US5] Extend API client in frontend/lib/api.ts to add listAudit method with filter and pagination parameters

**Checkpoint**: At this point, User Stories 1-5 should all work independently - users can review their complete activity history

---

## Phase 8: User Story 6 - Real-Time Task Sync Across Clients (Priority: P3)

**Goal**: Enable real-time synchronization of task changes across multiple browser tabs or devices

**Independent Test**: Open two browser tabs, create a task in one, verify it appears in the other within 2 seconds without manual refresh

### Backend - Services

- [x] T076 [US6] Extend task service in backend/src/services/task_service.py to publish TaskUpdateEvent after every task operation (create, update, complete, delete)

### WebSocket Service (Consumer)

- [x] T077 [P] [US6] Create websocket service main.py in services/websocket/main.py with FastAPI app and WebSocket endpoint GET /ws/{user_id}
- [x] T078 [P] [US6] Implement connection manager in services/websocket/main.py to track active WebSocket connections per user_id
- [x] T079 [P] [US6] Implement GET /dapr/subscribe in services/websocket/main.py returning subscription to "task-updates" topic
- [x] T080 [US6] Implement POST /task-updates handler in services/websocket/main.py to broadcast events to all user connections
- [x] T081 [P] [US6] Create Dockerfile for websocket service in services/websocket/Dockerfile
- [x] T082 [P] [US6] Create requirements.txt for websocket service in services/websocket/requirements.txt

### Frontend - WebSocket Client

- [x] T083 [P] [US6] Create WebSocket client in frontend/lib/websocket.ts with connectWebSocket, onMessage, disconnect, and auto-reconnect logic

### Frontend - Pages

- [x] T084 [US6] Update dashboard page in frontend/app/dashboard/page.tsx to connect to WebSocket and update task list on incoming messages

**Checkpoint**: At this point, all user stories (1-6) should work independently - users have a fully-featured, real-time task management system

---

## Phase 9: Deployment - Deploy and Run Locally on Minikube (Priority: P1) -- SKIPPED

**Status**: SKIPPED by user decision - proceeding directly to cloud deployment.

**Goal**: Deploy the entire application stack to local Minikube cluster with Dapr sidecars, Redpanda, and Helm charts

**Independent Test**: Run `helm install` on Minikube, verify all pods are healthy with Dapr sidecars, create a task via frontend, confirm event flows through Kafka

### Dapr Components

- [ ] T085 [P] Create kafka-pubsub component in dapr-components/kafka-pubsub.yaml for Redpanda (brokers: redpanda:9092, authType: none)
- [ ] T086 [P] Create statestore component in dapr-components/statestore.yaml for PostgreSQL with connectionString from secrets
- [ ] T087 [P] Create reminder-cron component in dapr-components/reminder-cron.yaml with schedule */5 * * * *
- [ ] T088 [P] Create kubernetes-secrets component in dapr-components/kubernetes-secrets.yaml

### Kubernetes Manifests

- [ ] T089 [P] Create namespace manifest in k8s/base/namespace.yaml for todo-app namespace
- [ ] T090 [P] Create secrets template in k8s/base/secrets.yaml for db-secrets
- [ ] T091 [P] Create kustomization in k8s/overlays/local/kustomization.yaml
- [ ] T092 [P] Create Redpanda deployment in k8s/overlays/local/redpanda-deployment.yaml

### Dockerfiles

- [ ] T093 [P] Create Dockerfile for backend in backend/Dockerfile
- [ ] T094 [P] Create Dockerfile for frontend in frontend/Dockerfile

### Helm Chart

- [ ] T095 Create Chart.yaml in helm/todo-app/Chart.yaml with metadata
- [ ] T096 Create values.yaml in helm/todo-app/values.yaml with default values for all 6 services
- [ ] T097 Create values-local.yaml in helm/todo-app/values-local.yaml with Minikube overrides (Redpanda enabled)
- [ ] T098 [P] Create frontend deployment template in helm/todo-app/templates/deployment-frontend.yaml with Dapr annotations
- [ ] T099 [P] Create backend deployment template in helm/todo-app/templates/deployment-backend.yaml with Dapr annotations
- [ ] T100 [P] Create recurring-task deployment template in helm/todo-app/templates/deployment-recurring-task.yaml with Dapr annotations
- [ ] T101 [P] Create notification deployment template in helm/todo-app/templates/deployment-notification.yaml with Dapr annotations
- [ ] T102 [P] Create audit deployment template in helm/todo-app/templates/deployment-audit.yaml with Dapr annotations
- [ ] T103 [P] Create websocket deployment template in helm/todo-app/templates/deployment-websocket.yaml with Dapr annotations
- [ ] T104 [P] Create service templates in helm/todo-app/templates/service-*.yaml for all deployments
- [ ] T105 [P] Create Redpanda deployment template in helm/todo-app/templates/redpanda-deployment.yaml (conditional on values.redpanda.enabled)
- [ ] T106 [P] Create Dapr components template in helm/todo-app/templates/dapr-components.yaml

### Deployment Validation

- [ ] T107 Build all Docker images and load into Minikube
- [ ] T108 Create Kubernetes secrets with Neon connection string
- [ ] T109 Apply Dapr components to Minikube cluster
- [ ] T110 Install Helm chart with values-local.yaml
- [ ] T111 Verify all pods running with 2/2 containers (app + Dapr sidecar)
- [ ] T112 Port forward frontend and test end-to-end task creation with event flow

**Checkpoint**: Full application deployed and validated on Minikube - ready for cloud deployment

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T113 [P] Add comprehensive error handling and user-friendly error messages across all frontend pages
- [ ] T114 [P] Add loading states and skeleton screens for async operations in frontend
- [ ] T115 [P] Implement retry logic with exponential backoff in Dapr client for transient failures
- [ ] T116 [P] Add structured logging with correlation IDs across all backend services
- [ ] T117 [P] Optimize database queries with proper indexes (user_id, status, priority, due_date, deleted_at)
- [ ] T118 [P] Add input sanitization and XSS prevention in frontend forms
- [ ] T119 [P] Configure CORS properly in backend for frontend origin
- [ ] T120 [P] Add health check endpoints for all services
- [ ] T121 [P] Create README.md with setup instructions for Minikube deployment
- [ ] T122 [P] Document API endpoints in OpenAPI/Swagger format
- [ ] T123 [P] Add architecture diagrams showing service communication and event flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Deployment (Phase 9)**: Can start after Foundational; benefits from having user stories complete for validation
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Depends on US1 for priority/tags to filter/sort
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Independent of other stories
- **User Story 5 (P3)**: Can start after Foundational - Consumes events from all stories but independently testable
- **User Story 6 (P3)**: Can start after Foundational - Broadcasts updates from all stories but independently testable

### Within Each User Story

- Models before services
- Services before routers
- Backend before frontend (for API contracts)
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Consumer services can be built in parallel
- Helm templates marked [P] can be created in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task T012: "Extend Task model with priority field"
Task T013: "Create Tag model"
Task T014: "Create TodoTag junction model"

# Launch all schemas for User Story 1 together:
Task T015: "Create Tag schemas"
Task T016: "Extend Task schemas with priority and tag_ids"

# Launch all frontend components for User Story 1 together:
Task T022: "Create PriorityBadge component"
Task T023: "Create TagChip component"
Task T024: "Create TagSelector component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Priority & Tags)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy to Minikube (Phase 9) if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Priority & Tags)
   - Developer B: User Story 3 (Due Dates & Reminders)
   - Developer C: User Story 4 (Recurring Tasks)
   - Developer D: Deployment infrastructure (Phase 9)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All event-driven features depend on Foundational phase (Dapr client, event publisher)
- Minikube deployment (Phase 9) can proceed in parallel with user story development for faster validation
