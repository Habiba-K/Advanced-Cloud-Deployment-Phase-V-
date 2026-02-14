# Advanced Todo Application Constitution (Phase-V)

<!--
Sync Impact Report:
- Version: 2.0.0 → 5.0.0
- Type: MAJOR - Complete architectural redefinition for event-driven microservices
- Modified Principles:
  - I. Security-First Design → Retained, updated for Dapr mTLS and Kubernetes RBAC
  - II. Stateless Architecture Mandate → Removed (replaced by Event-Driven Architecture)
  - III. Clean Separation of Concerns → Retained, redefined for microservices + Dapr sidecar
  - IV. MCP Tool-Only Data Access → Removed (replaced by Dapr-Abstracted Infrastructure)
  - V. Conversation-Driven Design → Removed (replaced by Advanced Task Features)
  - VI. Database as Single Source of Truth → Retained, expanded for event sourcing via Kafka
  - VII. Maintainability and Testability → Retained, expanded for distributed systems
- Added Principles:
  - II. Event-Driven Architecture (Kafka via Dapr Pub/Sub)
  - IV. Dapr-Abstracted Infrastructure (no direct Kafka/Redis client libraries)
  - V. Advanced Task Management Features
  - VIII. Local-First Deployment (Minikube validation before cloud)
  - IX. Cloud-Ready Deployment (DOKS/GKE/AKS with CI/CD)
  - X. Free-Tier Resource Strategy
- Removed Sections:
  - MCP Tool Requirements (Phase-III specific)
  - OpenAI Agents SDK Requirements (Phase-III specific)
  - Agent Behavior Standards (Phase-III specific)
  - Conversation Persistence Requirements (Phase-III specific)
  - OpenAI ChatKit UI Requirements (Phase-III specific)
- Added Sections:
  - Kafka Topics and Event Schemas
  - Dapr Building Blocks Configuration
  - Microservices Architecture
  - Local Deployment Requirements (Minikube + Redpanda Docker)
  - Cloud Deployment Requirements (DOKS/GKE/AKS + Redpanda Cloud)
  - CI/CD Pipeline Requirements (GitHub Actions)
  - Monitoring and Observability
- Templates Status:
  ⚠ plan-template.md - Constitution Check gates must reflect event-driven + Dapr principles
  ⚠ spec-template.md - User stories may include deployment/infrastructure scenarios
  ⚠ tasks-template.md - Task categories must include Dapr components, Helm charts, CI/CD
- Follow-up TODOs:
  - Update plan-template.md Constitution Check section with Phase-V gates
  - Update tasks-template.md to include infrastructure and deployment task categories
-->

## Core Principles

### I. Security-First Design

All authentication and authorization logic MUST enforce user isolation
at every layer. JWT tokens MUST be verified on every API request using
Better Auth. The authenticated user identity MUST be passed to all
service endpoints and event payloads. All database queries MUST filter
by authenticated user ID. No user may access another user's data under
any condition. Dapr Service Invocation MUST use mTLS for inter-service
communication. Kubernetes RBAC MUST restrict cluster access. All
secrets (API keys, DB credentials, Kafka credentials) MUST be stored
in Kubernetes Secrets and accessed via Dapr Secrets Management. No
secrets may be hardcoded in code, environment files committed to
source control, or Helm values.

**Rationale**: Multi-user distributed systems require strict data
isolation at the application layer and secure communication between
microservices. Dapr mTLS and Kubernetes Secrets provide defense in
depth.

### II. Event-Driven Architecture

All task lifecycle operations (create, update, complete, delete) MUST
publish events to Kafka via Dapr Pub/Sub. The system MUST use three
Kafka topics: `task-events` (all CRUD operations), `reminders`
(scheduled notification triggers), and `task-updates` (real-time
client sync). Consumer services (Recurring Task Service, Notification
Service, Audit Service, WebSocket Service) MUST subscribe to events
via Dapr Pub/Sub. Consumer services MUST process events idempotently
to handle duplicate delivery. The Backend API MUST NOT call consumer
services directly; all communication MUST flow through Kafka events.

**Rationale**: Event-driven architecture decouples producers from
consumers, enables independent scaling, provides a complete audit
trail, and allows adding new consumers without modifying the producer.
This is the foundation for recurring tasks, reminders, audit logging,
and real-time sync.

### III. Clean Separation of Concerns

The system MUST maintain strict separation between six service
boundaries: Frontend (Next.js UI), Backend API (FastAPI CRUD + event
publishing), Recurring Task Service (auto-creates next occurrence),
Notification Service (sends reminders), Audit Service (stores activity
log), and WebSocket Service (real-time client sync). Each service MUST
run in its own Kubernetes pod with a Dapr sidecar. No service may
directly import or call another service's code. All inter-service
communication MUST flow through Dapr Service Invocation or Dapr
Pub/Sub.

**Rationale**: Microservice boundaries enable independent deployment,
scaling, and testing. Dapr sidecars enforce communication contracts
and provide observability at the service mesh level.

### IV. Dapr-Abstracted Infrastructure

Application code MUST NOT import or use direct client libraries for
Kafka, Redis, or other infrastructure. All infrastructure interactions
MUST go through Dapr building blocks via HTTP calls to the local Dapr
sidecar (`http://localhost:3500`). The system MUST use these Dapr
building blocks: Pub/Sub (pubsub.kafka) for event streaming, State
Management (state.postgresql) for task cache, Input Bindings
(bindings.cron) for scheduled reminder checks, Secrets Management
(secretstores.kubernetes) for credentials, and Service Invocation for
frontend-to-backend calls with automatic retries. Infrastructure
backends MUST be swappable by changing Dapr component YAML
configuration without modifying application code.

**Rationale**: Dapr abstraction eliminates vendor lock-in, simplifies
application code, provides built-in retries and circuit breakers, and
enables switching from local Redpanda to Redpanda Cloud by changing a
YAML file.

### V. Advanced Task Management Features

The system MUST support these task attributes beyond basic CRUD:
priority levels (High, Medium, Low) with color-coded indicators, user-
scoped tags with many-to-many association, due dates with configurable
reminder times, and recurrence patterns (daily, weekly, monthly). The
system MUST provide search (text matching across title and
description), multi-criteria filtering (status, priority, tags, due
date range), and sorting (by creation date, due date, priority, title)
with URL-persisted state. All advanced features MUST respect user data
isolation.

**Rationale**: Advanced task attributes transform a basic CRUD app
into a productivity tool. Search, filter, and sort are essential for
usability at scale. These features drive the event-driven architecture
requirements.

### VI. Database as Single Source of Truth

The Neon PostgreSQL database (free tier) MUST be the authoritative
source for all user data, tasks, tags, and audit history. All write
operations MUST persist to the database before publishing events. The
database schema MUST include: users, todos (with priority, due_date,
remind_at, recurrence_pattern, recurrence_interval, next_occurrence),
tags, todo_tags (junction), and audit_log tables. All tables MUST have
created_at and updated_at timestamps. Soft deletes (deleted_at) MUST
be used for todos. Foreign keys and constraints MUST enforce
referential integrity.

**Rationale**: Database-first design ensures data durability and
consistency. Events are derived from database state, not the reverse.
The database is recoverable; Kafka topics are replayable but not the
source of truth.

### VII. Maintainability and Testability

Each microservice MUST be independently testable without requiring the
full cluster. Dapr components MUST be testable in isolation using
local Dapr standalone mode. Backend MUST use clear module separation:
routers, models, schemas, services, dependencies. Configuration MUST
use environment variables and Dapr Secrets (no hardcoded values). Code
MUST be readable with clear naming conventions. Helm charts MUST be
parameterized for local vs. cloud environments. All Kafka event
schemas MUST be documented and versioned.

**Rationale**: Distributed systems are inherently complex.
Independent testability of each service, clear module boundaries, and
infrastructure-as-code (Helm) reduce debugging time and deployment
risk.

### VIII. Local-First Deployment

All services MUST be deployable to a local Minikube cluster before
cloud deployment. Dapr MUST be installed on Minikube with all building
blocks (Pub/Sub, State, Bindings, Secrets, Service Invocation).
Redpanda Docker container MUST serve as the local Kafka-compatible
broker. Helm charts MUST support local deployment with Dapr sidecar
annotations. End-to-end validation on Minikube MUST pass before any
cloud deployment is attempted. The local deployment MUST connect to
the Neon Serverless PostgreSQL free tier.

**Rationale**: Local validation catches configuration errors, event
flow issues, and Dapr integration problems before they become costly
cloud debugging sessions. Minikube mirrors the production Kubernetes
environment.

### IX. Cloud-Ready Deployment

The system MUST be deployable to a managed Kubernetes service (DOKS,
GKE, or AKS) using Helm charts. Dapr MUST be installed on the cloud
cluster with full building blocks. Kafka MUST run on Redpanda Cloud
Serverless (free tier). CI/CD MUST be automated via GitHub Actions:
build Docker images, push to container registry, deploy to Kubernetes,
and manage secrets securely. Monitoring MUST be configured using
cloud-native tools or Prometheus + Grafana. Alerts MUST be set for
service failures and downtime.

**Rationale**: Cloud deployment validates production readiness.
Automated CI/CD prevents manual deployment errors and enables rapid
iteration. Monitoring ensures operational visibility.

### X. Free-Tier Resource Strategy

All infrastructure choices MUST prioritize free-tier or credit-based
services: Neon Serverless PostgreSQL (free tier), Redpanda Cloud
Serverless (free tier, no credit card), DigitalOcean DOKS ($200/60
days) or Google Cloud GKE ($300/90 days) or Azure AKS ($200/30 days).
No paid services may be introduced without explicit user approval. The
system MUST remain fully functional within free-tier resource limits.

**Rationale**: This is a learning/hackathon project. Free-tier
services eliminate financial barriers while providing production-grade
infrastructure experience.

## Technology Stack Requirements

**Mandatory Technologies**:
- Frontend: Next.js with App Router and TypeScript
- Backend: Python FastAPI with async/await
- Database: Neon Serverless PostgreSQL (free tier) with connection pooling
- Authentication: Better Auth (JWT token generation and validation)
- Event Streaming: Kafka via Redpanda (local: Docker container; cloud: Redpanda Cloud Serverless)
- Distributed Runtime: Dapr (sidecar pattern, all 5 building blocks)
- Container Orchestration: Kubernetes (local: Minikube; cloud: DOKS/GKE/AKS)
- Package Management: Helm charts with Dapr annotations
- CI/CD: GitHub Actions
- Monitoring: Prometheus + Grafana or cloud-native equivalent

**Technology Constraints**:
- Use Pydantic models for all API request/response schemas
- Use SQLModel or SQLAlchemy for database operations
- Backend MUST be async (async/await) for all I/O operations
- Use Dapr HTTP API for all Kafka, state, and secrets operations
- Use environment variables and Kubernetes Secrets for configuration
- Implement CORS for frontend-backend communication
- Use connection pooling (pgbouncer) for Neon database
- Helm charts MUST support both local (Minikube) and cloud overlays

**Prohibited Practices**:
- No direct Kafka client libraries (kafka-python, aiokafka) in application code
- No direct Redis/cache client libraries in application code
- No hardcoded secrets, API keys, or connection strings in code
- No plain text password storage (hashing required)
- No SQL string concatenation (use parameterized queries only)
- No bypassing authentication on protected endpoints
- No exposing other users' data in API responses or events
- No deploying to cloud without passing local Minikube validation
- No manual deployments (MUST use Helm + CI/CD)

## Functional Requirements

**Core Features (Web UI Interface)**:
The application MUST implement these features through a responsive web UI:

1. **Add Todo**: User creates a task with title, description, priority,
   tags, due date, reminder time, and recurrence pattern
2. **View Todos**: User sees their task list with search, filter, sort,
   and pagination
3. **Update Todo**: User edits task fields including priority, tags,
   due date, and recurrence
4. **Delete Todo**: User soft-deletes a task (confirmation required)
5. **Mark Complete/Incomplete**: Toggle task status; completing a
   recurring task triggers next occurrence creation

**Advanced Features**:
6. **Recurring Tasks**: Daily/weekly/monthly auto-creation on
   completion via Kafka events
7. **Due Dates & Reminders**: Cron-triggered checks every 5 minutes,
   in-app notifications
8. **Priorities**: High/Medium/Low with color-coded indicators and
   sort/filter support
9. **Tags**: User-scoped labels with many-to-many association, CRUD
   management, and filter support
10. **Search**: Text matching across title and description with
    debounced input
11. **Filter**: By status, priority, tags, due date range (AND logic),
    URL-persisted
12. **Sort**: By creation date, due date, priority, title
    (ascending/descending)
13. **Audit Log**: Paginated activity history from Kafka event
    consumers
14. **Real-Time Sync**: WebSocket broadcast of task changes across
    connected clients

**Kafka Topics and Event Schemas**:
- `task-events`: All task CRUD operations (consumed by Recurring Task
  Service, Audit Service)
- `reminders`: Scheduled reminder triggers (consumed by Notification
  Service)
- `task-updates`: Real-time client sync (consumed by WebSocket
  Service)

**Dapr Building Blocks**:
- `kafka-pubsub` (pubsub.kafka): Event streaming for all three topics
- `statestore` (state.postgresql): Task cache and session state
- `reminder-cron` (bindings.cron): Trigger reminder checks every 5
  minutes
- `kubernetes-secrets` (secretstores.kubernetes): API keys, DB
  credentials, Kafka credentials
- Service Invocation: Frontend-to-backend calls with automatic retries
  and mTLS

**Authentication Requirements**:
- User signup with email, password, name (optional)
- User signin with email and password
- JWT token generation on successful signin
- JWT token validation on every API request
- User ID extraction from JWT and passed to all endpoints
- Logout with proper token invalidation

**Database Schema Requirements**:
- **users**: id (UUID), email (unique), password_hash, name,
  created_at, updated_at
- **todos**: id (UUID), user_id (FK), title, description, status
  (pending/completed), priority (high/medium/low), due_date,
  remind_at, recurrence_pattern (none/daily/weekly/monthly),
  recurrence_interval, next_occurrence, completed_at, created_at,
  updated_at, deleted_at
- **tags**: id (UUID), user_id (FK), name, color, created_at
- **todo_tags**: todo_id (FK), tag_id (FK), PRIMARY KEY (todo_id,
  tag_id)
- **audit_log**: id (UUID), user_id (FK), event_type, task_id,
  task_data (JSONB), timestamp

**Microservices Architecture**:
- Frontend (Next.js): Web UI + Dapr Service Invocation
- Backend API (FastAPI): CRUD + event publishing via Dapr Pub/Sub
- Recurring Task Service: Subscribes to task-events, creates next
  occurrence
- Notification Service: Subscribes to reminders, delivers in-app
  notifications
- Audit Service: Subscribes to task-events, stores activity log
- WebSocket Service: Subscribes to task-updates, broadcasts to clients

## Quality and Security Standards

**Security Requirements (NON-NEGOTIABLE)**:
- Password hashing with bcrypt or argon2
- JWT token validation on all protected endpoints
- User ID filtering on all database queries
- Input validation and sanitization on all inputs
- SQL injection prevention (parameterized queries only)
- XSS prevention (escape user input in frontend)
- CSRF protection
- Rate limiting on authentication endpoints
- Dapr mTLS for inter-service communication
- Kubernetes RBAC for cluster access control
- Secrets managed via Dapr Secrets Management (not env vars in code)

**Error Handling Standards**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User mismatch or ownership violation
- 404 Not Found: Nonexistent resource under user scope
- 422 Validation Error: Invalid request payload
- 500 Internal Server Error: Unexpected errors (with logging)
- Kafka consumer errors: Log, retry with backoff, dead-letter on
  repeated failure

**Performance Standards**:
- Database connection pooling for serverless environment
- Proper indexes on frequently queried columns (user_id, status,
  due_date, priority)
- Search results within 1 second for 100+ tasks
- Reminder delivery within 5 minutes of scheduled time
- Recurring task creation within 5 seconds of completion
- Real-time sync within 2 seconds across clients
- Minikube full deployment in under 10 minutes

**Data Integrity Standards**:
- Foreign keys and constraints for referential integrity
- Timestamps (created_at, updated_at) on all tables
- Soft deletes (deleted_at) for todos
- Database transactions for multi-table operations
- Idempotent event consumers (handle duplicate Kafka messages)
- Event ordering within a partition (task_id as partition key)

## Development Workflow

**Spec-Driven Development Mandate**:
All development MUST follow the Agentic Dev Stack workflow:
1. Write specification using `/sp.specify`
2. Generate implementation plan using `/sp.plan`
3. Break into tasks using `/sp.tasks`
4. Implement via Claude Code using `/sp.implement`
5. NO manual coding allowed - all development through agents

**Agent Usage Requirements**:
- Use `secure-auth-agent` for authentication and JWT validation
- Use `backend-engineer` for FastAPI endpoints and business logic
- Use `neon-db-expert` for database schema and query optimization
- Use `nextjs-ui-builder` for frontend pages and components
- Use `task-feature-engineer` for advanced task features (priorities,
  tags, search, filter, sort, recurring tasks, reminders)
- Use `event-driven-infra-expert` for Dapr components and Kafka
  configuration
- Use `local-stack-validator` for Minikube end-to-end validation
- Use `dapr-cloud-deployer` for cloud Kubernetes deployment and CI/CD
- Coordinate sequentially: Database -> Backend -> Dapr/Kafka ->
  Features -> Frontend -> Local Validation -> Cloud Deployment

**Code Review Standards**:
- All changes must reference specific user stories or requirements
- Security-sensitive code requires extra scrutiny
- Database migrations must be reversible
- Dapr component YAML changes must be tested locally before cloud
- Helm chart changes must be validated on Minikube
- Event schema changes must be backward compatible

**Documentation Requirements**:
- API endpoints documented with OpenAPI/Swagger (auto-generated)
- Kafka event schemas documented with field types and examples
- Dapr component YAML files documented with purpose and configuration
- Helm chart values documented for local vs. cloud overrides
- README with setup instructions for Minikube and cloud deployment
- Database schema documented in Alembic migrations

## Governance

**Constitution Authority**:
This constitution supersedes all other development practices and
guidelines. When conflicts arise between this document and other
sources, this constitution takes precedence.

**Amendment Process**:
1. Proposed amendments must be documented with rationale
2. Impact analysis required for all dependent templates and code
3. Version must be incremented according to semantic versioning:
   - MAJOR: Backward incompatible principle removals or redefinitions
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording fixes, non-semantic refinements
4. All amendments must update LAST_AMENDED_DATE

**Compliance Verification**:
- All pull requests must verify compliance with security principles
- Code reviews must check for principle violations
- Dapr abstraction must be enforced (no direct infrastructure clients)
- Event-driven patterns must be verified (events published for all
  task operations)
- Local Minikube validation must pass before cloud deployment
- Free-tier resource usage must be verified
- Complexity that violates principles must be explicitly justified in
  plan.md
- Constitution Check section in plan-template.md must be completed
  before implementation

**Enforcement**:
- Principle violations in security, Dapr abstraction, or event-driven
  architecture are blocking issues
- Deploying to cloud without local validation is a blocking issue
- Using paid services without approval is a blocking issue
- Maintainability and standards violations may not block if justified
- All justifications for principle violations must be documented in
  Complexity Tracking section

**Version**: 5.0.0 | **Ratified**: 2026-01-22 | **Last Amended**: 2026-02-08
