# Feature Specification: Advanced Features & Local Deployment

**Feature Branch**: `001-advanced-features-local-deploy`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Spec-6: Advanced Features & Local Deployment — Recurring tasks, due dates & reminders, priorities, tags, search/filter/sort, event-driven architecture with Kafka via Dapr Pub/Sub, audit logging, real-time sync, and local Minikube deployment with full Dapr building blocks and Redpanda Docker."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Priority and Tags on Tasks (Priority: P1)

As an authenticated user, I want to assign a priority level (High, Medium, Low) and one or more tags (e.g., Work, Home, Personal) to my tasks so I can organize and categorize them effectively.

**Why this priority**: Priorities and tags are the foundational organizational layer. Every other advanced feature (search, filter, sort) depends on these attributes existing on tasks. This provides immediate user value with minimal infrastructure complexity.

**Independent Test**: Can be fully tested by creating a task with priority "High" and tags "Work" and "Personal", then verifying the task displays the correct priority badge and tag chips. Delivers organizational value as a standalone feature.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the create-task form, **When** they select priority "High" and add tags "Work" and "Personal", **Then** the created task displays with the High priority indicator and both tag labels.
2. **Given** an existing task with priority "Low", **When** the user edits it and changes priority to "Medium", **Then** the updated task reflects the new priority immediately.
3. **Given** no tags exist yet for the user, **When** the user types a new tag name "Errands" while creating a task, **Then** the tag is created and associated with the task.
4. **Given** a user has existing tags, **When** they open the tag management view, **Then** they can rename or delete tags and changes propagate to all associated tasks.

---

### User Story 2 - Search, Filter, and Sort Tasks (Priority: P1)

As an authenticated user, I want to search across my tasks by keyword, filter them by status, priority, tags, or due date range, and sort them by date, priority, or title so I can quickly find and organize what I need.

**Why this priority**: Search, filter, and sort are critical for usability once a user has many tasks. These are the primary navigation tools for a task management application and directly impact daily productivity.

**Independent Test**: Can be tested by creating 10+ tasks with varying priorities, tags, and due dates, then searching for a keyword, applying a priority filter, and toggling sort order. Delivers value as a standalone productivity feature.

**Acceptance Scenarios**:

1. **Given** a user with 20 tasks, **When** they type "meeting" in the search bar, **Then** only tasks containing "meeting" in the title or description are displayed, with matching text highlighted.
2. **Given** a user viewing their task list, **When** they select the filter "Priority: High" and "Tag: Work", **Then** only tasks matching both criteria are shown.
3. **Given** a filtered task list, **When** the user selects "Sort by: Due Date (ascending)", **Then** tasks are reordered with the earliest due dates first.
4. **Given** active filters and search, **When** the user shares or reloads the page, **Then** the filter/search/sort state is preserved in the URL.

---

### User Story 3 - Set Due Dates and Receive Reminders (Priority: P2)

As an authenticated user, I want to set due dates on tasks and receive reminder notifications before a task is due so I never miss a deadline.

**Why this priority**: Due dates and reminders are the first event-driven feature requiring Kafka message flow. This story validates the core Pub/Sub infrastructure while delivering high user value.

**Independent Test**: Can be tested by creating a task with a due date 10 minutes in the future, then verifying the system generates a reminder notification at the configured remind-ahead time. Validates the full event pipeline from publishing to notification delivery.

**Acceptance Scenarios**:

1. **Given** a user creating a task, **When** they set a due date of "2026-02-15" and a reminder of "1 day before", **Then** the system records the due date and schedules a reminder for 2026-02-14.
2. **Given** a task with a due date approaching, **When** the reminder time arrives, **Then** the user sees an in-app notification with the task title and due date.
3. **Given** a user editing an existing task, **When** they change the due date, **Then** the reminder is rescheduled accordingly.
4. **Given** a task is marked complete before the reminder fires, **When** the reminder time arrives, **Then** no notification is sent.

---

### User Story 4 - Create and Manage Recurring Tasks (Priority: P2)

As an authenticated user, I want to set tasks to recur on a schedule (daily, weekly, monthly) so that routine tasks are automatically re-created when I complete the current occurrence.

**Why this priority**: Recurring tasks are a key advanced feature that exercises the event-driven architecture (task completion events trigger new task creation via Kafka). This validates the Pub/Sub consumer pattern.

**Independent Test**: Can be tested by creating a task with recurrence "weekly", marking it complete, and verifying a new task is automatically created with the next week's due date. Validates the full recurring task engine independently.

**Acceptance Scenarios**:

1. **Given** a user creating a task, **When** they set recurrence to "weekly", **Then** the task shows a recurrence indicator and the next occurrence date is calculated.
2. **Given** a recurring task (weekly) with due date 2026-02-08, **When** the user marks it complete, **Then** a new task with the same title, description, tags, and priority is created with due date 2026-02-15.
3. **Given** a recurring task, **When** the user edits the recurrence to "monthly", **Then** future occurrences follow the monthly schedule.
4. **Given** a recurring task, **When** the user deletes it, **Then** no future occurrences are created.
5. **Given** a recurring task (daily) is completed, **When** the next occurrence is generated, **Then** the new task inherits all tags, priority, and description from the original.

---

### User Story 5 - View Activity Audit Log (Priority: P3)

As an authenticated user, I want to view a chronological log of all my task actions (created, updated, completed, deleted) so I can review my activity history and track changes.

**Why this priority**: The audit log is a consumer of events already being published by higher-priority stories. It validates the multi-consumer pattern on Kafka topics and provides transparency, but is not critical for daily task management.

**Independent Test**: Can be tested by performing several task operations (create, edit, complete, delete), then opening the audit log page and verifying all actions appear in chronological order with correct details.

**Acceptance Scenarios**:

1. **Given** a user has performed task operations, **When** they navigate to the audit log page, **Then** they see a paginated, chronological list of all their actions.
2. **Given** the audit log, **When** the user views an entry, **Then** it shows the event type (created/updated/completed/deleted), task title, and timestamp.
3. **Given** a long audit history, **When** the user scrolls or paginates, **Then** older entries load without performance degradation.

---

### User Story 6 - Real-Time Task Sync Across Clients (Priority: P3)

As a user with multiple browser tabs or devices open, I want to see task changes made in one client reflected instantly in all other open clients so my task list is always up to date.

**Why this priority**: Real-time sync is an advanced feature that exercises the WebSocket + Kafka pipeline. It enhances the user experience but is not required for core task management functionality.

**Independent Test**: Can be tested by opening two browser tabs, creating a task in one, and verifying it appears in the other within 2 seconds without manual refresh.

**Acceptance Scenarios**:

1. **Given** a user has two browser tabs open, **When** they create a task in Tab A, **Then** the new task appears in Tab B within 2 seconds.
2. **Given** a user marks a task complete in one client, **When** the event propagates, **Then** all other connected clients show the updated status.
3. **Given** a client loses its connection, **When** the connection is re-established, **Then** the client fetches the latest state to sync up.

---

### User Story 7 - Deploy and Run Locally on Minikube (Priority: P1)

As a developer, I want to deploy the entire application (frontend, backend, microservices, Kafka, Dapr sidecars) to a local Minikube cluster using Helm charts so I can validate the full distributed system before deploying to cloud.

**Why this priority**: Local deployment is the validation gateway for all other stories. Without a working Minikube setup with Dapr and Kafka, no event-driven features can be tested in a realistic environment.

**Independent Test**: Can be tested by running `helm install` on Minikube, verifying all pods are healthy (including Dapr sidecars), creating a task via the frontend, and confirming the event flows through Kafka to consumer services.

**Acceptance Scenarios**:

1. **Given** a fresh Minikube cluster with Dapr installed, **When** the developer runs the Helm chart deployment, **Then** all services start with healthy Dapr sidecars (frontend, backend, recurring-task, notification, audit, websocket).
2. **Given** all services running on Minikube, **When** a user creates a task with a due date via the frontend, **Then** the task-events and reminders Kafka topics receive messages (verifiable via Redpanda console).
3. **Given** the Dapr cron binding is active, **When** 5 minutes elapse, **Then** the reminder-cron handler is invoked and checks for upcoming due tasks.
4. **Given** the developer needs to reset the local environment, **When** they run `helm uninstall`, **Then** all resources are cleanly removed.

---

### Edge Cases

- What happens when a user creates a recurring task without a due date? The system sets the first occurrence to today's date.
- What happens when a user applies conflicting filters (e.g., status=completed AND priority=urgent) that return no results? The system shows an empty state message: "No tasks match your filters."
- What happens when the Kafka broker (Redpanda) is temporarily unavailable? The Dapr sidecar retries message delivery with exponential backoff; task CRUD operations still succeed (events are queued).
- What happens when a user deletes a tag that is assigned to multiple tasks? The tag is removed from all associated tasks and the tag is deleted.
- What happens when two clients simultaneously edit the same task? Last-write-wins semantics apply; the real-time sync notifies both clients of the final state.
- What happens when the reminder cron fires but the notification service is down? Events remain in the Kafka topic until the notification service recovers and consumes them.
- What happens when a user searches with special characters (e.g., `<script>`)? Input is sanitized; special characters are treated as literal search terms.

## Requirements *(mandatory)*

### Functional Requirements

**Priority & Tags:**
- **FR-001**: System MUST allow users to assign a priority level (High, Medium, Low) to any task, defaulting to Medium if not specified.
- **FR-002**: System MUST allow users to create, rename, and delete tags that are scoped to their account.
- **FR-003**: System MUST allow users to associate one or more tags with a task.
- **FR-004**: System MUST display priority as a color-coded indicator (High=red, Medium=yellow, Low=green) on the task list.

**Search, Filter, Sort:**
- **FR-005**: System MUST provide a search bar that performs text matching across task titles and descriptions with debounced input (300ms delay).
- **FR-006**: System MUST support filtering tasks by status (pending/completed), priority level, one or more tags, and due date range.
- **FR-007**: System MUST support sorting tasks by creation date, due date, priority, or title in ascending or descending order.
- **FR-008**: System MUST persist active filter, search, and sort state in URL query parameters so the view is shareable and survives page refresh.

**Due Dates & Reminders:**
- **FR-009**: System MUST allow users to set an optional due date (date) and reminder time (datetime) on any task.
- **FR-010**: System MUST publish a reminder event to the messaging system when a task with a due date is created or its due date is changed.
- **FR-011**: System MUST check for upcoming due tasks on a recurring schedule (every 5 minutes) and generate notifications for tasks due within the reminder window.
- **FR-012**: System MUST deliver in-app notifications to users for upcoming task deadlines.
- **FR-013**: System MUST NOT send a reminder notification for a task that has already been marked complete.

**Recurring Tasks:**
- **FR-014**: System MUST allow users to set a recurrence pattern (none, daily, weekly, monthly) on any task.
- **FR-015**: System MUST automatically create the next occurrence of a recurring task when the current one is marked complete.
- **FR-016**: The new occurrence MUST inherit the title, description, priority, tags, and recurrence settings from the completed task, with the due date advanced by the recurrence interval.
- **FR-017**: System MUST stop generating occurrences when a user deletes a recurring task or changes its recurrence to "none".

**Audit Log:**
- **FR-018**: System MUST record every task operation (create, update, complete, delete) as an event with event type, task details, user, and timestamp.
- **FR-019**: System MUST provide users a paginated view of their own audit log, ordered by most recent first.

**Real-Time Sync:**
- **FR-020**: System MUST broadcast task changes to all connected clients of the same user within 2 seconds of the change.
- **FR-021**: System MUST re-synchronize a client's state when it reconnects after a disconnection.

**Event-Driven Architecture:**
- **FR-022**: System MUST publish task lifecycle events to a message broker via the distributed runtime's Pub/Sub abstraction (not direct broker client libraries).
- **FR-023**: System MUST use three event channels: one for general task events, one for reminder events, and one for real-time update events.
- **FR-024**: Consumer services MUST process events idempotently to handle duplicate delivery.

**Local Deployment:**
- **FR-025**: System MUST be deployable to a local single-node cluster using a package manager (Helm charts).
- **FR-026**: The local deployment MUST include the distributed application runtime with all building blocks: Pub/Sub, State Management, Input Bindings (cron), Secrets Management, and Service Invocation.
- **FR-027**: The local deployment MUST use a lightweight, Kafka-compatible message broker (Redpanda Docker container).
- **FR-028**: The local deployment MUST connect to the existing Neon Serverless PostgreSQL database (free tier).
- **FR-029**: All inter-service communication in the local deployment MUST flow through the distributed runtime sidecars.

### Key Entities

- **Task**: A user-owned work item with title, description, status, priority (High/Medium/Low), due date, reminder time, recurrence pattern, and completion state. Tasks can be associated with multiple tags.
- **Tag**: A user-scoped label with a name and optional color. Tags can be associated with multiple tasks (many-to-many relationship).
- **Audit Entry**: A timestamped record of a task operation containing event type, task snapshot, and acting user.
- **Reminder**: A scheduled notification linked to a task, containing the task reference, due time, and notification delivery time.
- **Recurrence Rule**: A pattern (daily/weekly/monthly) and interval attached to a task that governs automatic creation of the next occurrence.

### Assumptions

- The existing authentication system (Better Auth with JWT) from previous phases is already in place and will be reused. All new endpoints require authentication.
- The existing task CRUD endpoints from Phase II will be extended (not rebuilt) to support new fields (priority, tags, due date, recurrence).
- Default reminder lead time is 1 hour before the due date unless the user specifies a custom remind-at time.
- The "in-app notification" for reminders is a persistent notification badge/toast within the web application (not email or push notifications).
- Tag colors default to a system-assigned palette if the user does not specify a color.
- Search uses simple text matching (LIKE/ILIKE) rather than a dedicated search engine. Full-text search indexing may be added later if performance requires it.
- The Minikube deployment targets a single-node cluster with minimum 4GB RAM and 2 CPUs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can assign priority and tags to a task and see them reflected in the task list within 1 second of saving.
- **SC-002**: Users can search across 100+ tasks and see filtered results within 1 second of typing, with matching terms highlighted.
- **SC-003**: Users can combine 3+ filters simultaneously and the result updates within 1 second.
- **SC-004**: Reminder notifications are delivered to users within 5 minutes of the scheduled reminder time.
- **SC-005**: When a recurring task is completed, the next occurrence is created within 5 seconds.
- **SC-006**: Task changes made in one client appear in all other connected clients within 2 seconds.
- **SC-007**: The audit log captures 100% of task operations with no missed events.
- **SC-008**: A developer can deploy the full system to Minikube in under 10 minutes using a single Helm command.
- **SC-009**: All services in the Minikube deployment start with healthy sidecars and pass readiness checks within 3 minutes of deployment.
- **SC-010**: The system handles 50 concurrent users performing task operations without degradation.
