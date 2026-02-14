# Claude Code Rules

This file is generated during init for the selected agent.

You are an expert AI assistant specializing in Spec-Driven Development (SDD). Your primary goal is to work with the architext to build products.

## Project Context: Phase V — Advanced Cloud Deployment

**Project Overview:**
Implement advanced features (Recurring Tasks, Due Dates & Reminders, Priorities, Tags, Search, Filter, Sort) and deploy the Todo application with event-driven architecture using Dapr and Kafka. Deploy first on Minikube locally, then to production-grade Kubernetes on a cloud provider (DigitalOcean DOKS / Google Cloud GKE / Azure AKS) with Kafka on Redpanda Cloud.

**Tech Stack:**
- **Frontend:** Next.js (React-based framework)
- **Backend:** FastAPI (Python web framework)
- **Database:** Neon Serverless PostgreSQL
- **Authentication:** Better Auth
- **Event Streaming:** Kafka (Redpanda Cloud — free serverless tier)
- **Distributed Runtime:** Dapr (sidecar pattern)
- **Container Orchestration:** Kubernetes (Minikube local, DOKS/GKE/AKS cloud)
- **CI/CD:** GitHub Actions
- **Local Kafka:** Redpanda Docker container (Kafka-compatible)
- **Development Approach:** Spec-Driven Development (no manual coding)

**Phase V is split into three parts:**

### Part A: Advanced Features
- Implement **Advanced Level** features: Recurring Tasks, Due Dates & Reminders
- Implement **Intermediate Level** features: Priorities, Tags, Search, Filter, Sort
- Add event-driven architecture with Kafka (via Dapr Pub/Sub)
- Implement Dapr for distributed application runtime

### Part B: Local Deployment (Minikube)
- Deploy all services to Minikube
- Deploy Dapr on Minikube with **Full Dapr**: Pub/Sub, State, Bindings (cron), Secrets, Service Invocation
- Use Redpanda Docker container as local Kafka

### Part C: Cloud Deployment
- Deploy to DigitalOcean Kubernetes (DOKS) / Google Cloud (GKE) / Azure (AKS)
- Deploy Dapr on cloud cluster with **Full Dapr**: Pub/Sub, State, Bindings (cron), Secrets, Service Invocation
- Use Kafka on **Redpanda Cloud** (free serverless tier)
- Set up CI/CD pipeline using GitHub Actions
- Configure monitoring and logging

**Free Tier Cloud Providers:**
| Provider | Credit | Duration |
|---|---|---|
| DigitalOcean | $200 | 60 days |
| Google Cloud (GKE) | $300 | 90 days |
| Microsoft Azure (AKS) | $200 | 30 days + 12 months free services |

**Workflow Mandate:**
Follow the Agentic Dev Stack workflow strictly:
1. Write spec (using `/sp.specify`)
2. Generate plan (using `/sp.plan`)
3. Break into tasks (using `/sp.tasks`)
4. Implement via Claude Code (using `/sp.implement`)
5. NO manual coding allowed — all development through agents

## Task context

**Your Surface:** You operate on a project level, providing guidance to users and executing development tasks via a defined set of tools.

**Your Success is Measured By:**
- All outputs strictly follow the user intent.
- Prompt History Records (PHRs) are created automatically and accurately for every user prompt.
- Architectural Decision Record (ADR) suggestions are made intelligently for significant decisions.
- All changes are small, testable, and reference code precisely.

## Core Guarantees (Product Promise)

- Record every user input verbatim in a Prompt History Record (PHR) after every user message. Do not truncate; preserve full multiline input.
- PHR routing (all under `history/prompts/`):
  - Constitution -> `history/prompts/constitution/`
  - Feature-specific -> `history/prompts/<feature-name>/`
  - General -> `history/prompts/general/`
- ADR suggestions: when an architecturally significant decision is detected, suggest: "Architectural decision detected: <brief>. Document? Run `/sp.adr <title>`." Never auto-create ADRs; require user consent.

## Specialized Agent Usage

For this project, you MUST use specialized agents for their respective domains. These agents have deep expertise and should be invoked proactively.

### 1. Authentication Agent (`secure-auth-agent`)
**Use for:**
- User signup/signin/logout flows
- Better Auth integration and configuration
- Password hashing and validation
- JWT/session token management
- Access control and authorization logic
- Security vulnerability prevention (XSS, CSRF, SQL injection)
- Authentication middleware implementation

**When to invoke:**
- ANY authentication-related feature implementation
- Security reviews of auth endpoints
- User session management
- Password reset/change functionality
- Role-based access control (RBAC)

### 2. Frontend Agent (`nextjs-ui-builder`)
**Use for:**
- Building Next.js pages and components
- Responsive UI design and layouts
- React component development
- Form creation and validation (client-side)
- State management (React hooks, context)
- Client-side routing and WebSocket integration
- UI/UX implementation
- Styling (CSS, Tailwind, etc.)

**When to invoke:**
- Creating new pages or UI components
- Implementing responsive designs
- Building forms and interactive elements (search, filter, sort UI)
- Optimizing frontend performance
- Adding client-side interactivity and real-time updates

### 3. Database Agent (`neon-db-expert`)
**Use for:**
- Neon Serverless PostgreSQL schema design
- Database migrations (Alembic)
- Table creation and relationships
- Indexing strategies
- Query optimization
- Connection pooling configuration
- Data modeling and normalization
- Database constraints and triggers

**When to invoke:**
- Designing/extending database schema (tags, recurrence rules, reminders)
- Creating or modifying tables
- Performance issues with queries
- Migration creation and execution
- Database connection problems
- Data integrity concerns

### 4. Backend Agent (`backend-engineer`)
**Use for:**
- FastAPI route implementation
- RESTful API design
- Request/response handling
- API validation and error handling
- Business logic implementation (recurring tasks, reminders, priorities)
- Database query integration
- Dapr HTTP API calls from application code
- API documentation (OpenAPI/Swagger)

**When to invoke:**
- Creating API endpoints
- Implementing business logic
- API performance issues
- Request validation
- Error handling strategies

### 5. Task Feature Engineer Agent (`task-feature-engineer`)
**Use for:**
- Implementing advanced task attributes (priority levels, tags, categories)
- Implementing time-based features (due dates, reminders, recurrence patterns)
- Building search and filter capabilities
- Integrating event-driven communication patterns
- Setting up Kafka/Dapr infrastructure for messaging
- Improving task management workflows

**When to invoke:**
- Adding priority levels (low, medium, high, urgent) and tagging system
- Implementing recurring tasks and reminder notifications
- Building advanced search, filter, sort features
- Wiring up Kafka events for task lifecycle

### 6. Event-Driven Infrastructure Agent (`event-driven-infra-expert`)
**Use for:**
- Dapr component configuration (Pub/Sub, State, Bindings, Secrets)
- Kafka topic setup and management
- Pub/Sub messaging patterns
- Event-driven architecture design
- Service invocation infrastructure via Dapr
- Configuring Redpanda Cloud (free tier) for cloud Kafka
- Local Redpanda Docker setup for Minikube

**When to invoke:**
- Setting up Dapr components (YAML configurations)
- Configuring Kafka topics (task-events, reminders, task-updates)
- Debugging event flow or message delivery issues
- Migrating from local Redpanda Docker to Redpanda Cloud
- Optimizing pub/sub performance or reliability
- Setting up cron bindings for scheduled reminders

### 7. Local Stack Validator Agent (`local-stack-validator`)
**Use for:**
- Validating Minikube deployment end-to-end
- Testing Kafka message flow (produce/consume)
- Verifying Dapr sidecar health and component connectivity
- Frontend-to-backend integration checks via Dapr service invocation
- Real-time feature verification (WebSocket, reminders)
- Pre-deployment validation before cloud push

**When to invoke:**
- After deploying to Minikube, before moving to cloud
- When debugging distributed system issues locally
- To validate new feature implementations end-to-end
- For troubleshooting Dapr or Kafka integration problems

### 8. Cloud Deployer Agent (`dapr-cloud-deployer`)
**Use for:**
- Deploying microservices to DOKS/GKE/AKS with Dapr sidecars
- Setting up CI/CD pipelines with GitHub Actions
- Configuring Kubernetes clusters and Dapr runtime in cloud
- Integrating Redpanda Cloud with Dapr pub/sub components
- Helm chart management and rollbacks
- Monitoring and logging setup
- Scaling and cloud resource optimization

**When to invoke:**
- Deploying services to cloud Kubernetes
- Setting up or troubleshooting CI/CD pipelines
- Configuring Redpanda Cloud as Dapr pub/sub backend
- Implementing monitoring and alerting
- Managing Helm releases

### 9. UI/UX Enhancement Agent (`ui-ux-enhancer`)
**Use for:**
- Improving visual design consistency
- Enhancing responsiveness across devices
- Optimizing user flow between pages
- Creating or improving the homepage/landing page

**When to invoke:**
- When the application needs design polish
- When responsive layout issues are identified

### Agent Coordination Strategy

**Multi-agent workflows for Phase V features:**
When a feature spans multiple domains, coordinate agents sequentially:

1. **Database First:** Use `neon-db-expert` to extend schema (tags, recurrence, reminders)
2. **Backend Second:** Use `backend-engineer` to create API endpoints
3. **Event Infrastructure:** Use `event-driven-infra-expert` to set up Dapr components and Kafka topics
4. **Feature Logic:** Use `task-feature-engineer` to wire up event-driven task features
5. **Frontend:** Use `nextjs-ui-builder` to build UI (search, filter, sort, tag management)
6. **Auth Integration:** Use `secure-auth-agent` to secure new endpoints
7. **Local Validation:** Use `local-stack-validator` to verify on Minikube
8. **Cloud Deployment:** Use `dapr-cloud-deployer` to deploy to DOKS/GKE/AKS

**Example full-stack feature flow:**
```
Feature: Recurring Tasks with Kafka Events

Step 1: Database Schema
- Agent: neon-db-expert
- Task: Add recurrence_pattern, recurrence_interval, next_occurrence columns to todos table

Step 2: API Endpoints
- Agent: backend-engineer
- Task: Create endpoints for setting/managing recurrence on todos

Step 3: Event Infrastructure
- Agent: event-driven-infra-expert
- Task: Configure Dapr pub/sub component for Kafka, create task-events topic

Step 4: Feature Wiring
- Agent: task-feature-engineer
- Task: Publish task-completed events via Dapr, build recurring task consumer service

Step 5: Frontend UI
- Agent: nextjs-ui-builder
- Task: Add recurrence options to todo create/edit forms

Step 6: Local Validation
- Agent: local-stack-validator
- Task: Verify recurring task flow end-to-end on Minikube

Step 7: Cloud Deployment
- Agent: dapr-cloud-deployer
- Task: Deploy recurring task service to cloud cluster with Dapr sidecar
```

## Technology Stack Guidelines

### Next.js Frontend Best Practices
- Use App Router (not Pages Router) for new features
- Implement Server Components by default; use Client Components only when needed (interactivity, hooks)
- Use TypeScript for type safety
- Implement responsive design with Tailwind CSS or CSS modules
- Follow React best practices: component composition, proper state management
- Use Next.js built-in features: Image optimization, Link component, metadata API
- Implement proper error boundaries and loading states
- Use environment variables for API endpoints (NEXT_PUBLIC_ prefix for client-side)
- Implement WebSocket client for real-time task updates

### FastAPI Backend Best Practices
- Use Pydantic models for request/response validation
- Implement proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Use dependency injection for database sessions and auth
- Implement comprehensive error handling with custom exception handlers
- Use async/await for database operations
- Document APIs with OpenAPI/Swagger (auto-generated by FastAPI)
- Implement CORS properly for Next.js frontend
- Use environment variables for sensitive configuration
- Structure: routers, models, schemas, services, dependencies
- Use Dapr HTTP API (`http://localhost:3500/...`) for pub/sub, state, secrets — no direct Kafka/Redis client libraries needed
- Implement Dapr subscription endpoints for consuming events

### Neon Serverless PostgreSQL Best Practices
- Use connection pooling (pgbouncer) for serverless environments
- Implement proper indexes for frequently queried columns
- Use foreign keys and constraints for data integrity
- Design schema with normalization principles
- Use migrations for schema changes (Alembic recommended)
- Implement soft deletes where appropriate (deleted_at column)
- Add created_at and updated_at timestamps to all tables
- Use UUIDs for primary keys in multi-tenant scenarios
- Optimize queries: avoid N+1 problems, use JOINs efficiently

### Better Auth Integration Best Practices
- Store hashed passwords only (never plain text)
- Implement JWT tokens with appropriate expiration
- Use refresh tokens for long-lived sessions
- Implement proper CORS and CSRF protection
- Validate tokens on every protected endpoint
- Use secure HTTP-only cookies for token storage
- Implement rate limiting on auth endpoints
- Add email verification for new accounts
- Implement password strength requirements
- Log authentication events for security auditing

### Multi-User Data Isolation
- Every data table must have a user_id foreign key
- Filter all queries by authenticated user_id
- Implement row-level security in database or application layer
- Never expose other users' data in API responses
- Validate user ownership before update/delete operations
- Use database transactions for multi-table operations
- Implement proper authorization checks (not just authentication)

### Dapr Best Practices
- App communicates with Dapr sidecar via HTTP on `http://localhost:3500`
- Use Dapr Pub/Sub for all Kafka interactions — no direct kafka-python library
- Use Dapr State Management for conversation/session state
- Use Dapr Bindings (cron) for scheduled reminder checks
- Use Dapr Secrets Management for API keys and DB credentials
- Use Dapr Service Invocation for inter-service calls with built-in retries and mTLS
- Define all Dapr components in YAML files under `dapr-components/`
- Swap infrastructure backends by changing YAML config, not application code

### Kafka / Redpanda Best Practices
- **Local (Minikube):** Use Redpanda Docker container (single binary, no Zookeeper, Kafka-compatible)
- **Cloud:** Use Redpanda Cloud Serverless free tier (no credit card for basic usage)
- Standard Kafka clients and APIs work with Redpanda unchanged
- Create three Kafka topics: `task-events`, `reminders`, `task-updates`
- Use Dapr Pub/Sub abstraction — app code never touches Kafka client directly
- Design idempotent consumers to handle duplicate messages
- Use consumer groups for horizontal scaling

### Kubernetes & Deployment Best Practices
- Use Helm charts for repeatable deployments
- Deploy Dapr on cluster with `dapr init -k`
- Annotate pods for Dapr sidecar injection (`dapr.io/enabled: "true"`)
- Use Kubernetes Secrets for sensitive values (consumed via Dapr secrets store)
- Set resource requests and limits for all pods
- Use liveness and readiness probes
- Implement rolling updates with zero-downtime deploys
- Use namespaces to isolate environments (dev, staging, prod)

## Phase V: Advanced Todo Application Requirements

### Part A: Advanced Features

#### Advanced Level Features

**1. Recurring Tasks**
- Users can set tasks to recur: daily, weekly, monthly, custom interval
- When a recurring task is marked complete, an event is published to Kafka (`task-events` topic)
- A separate Recurring Task Service consumes the event and auto-creates the next occurrence
- Recurrence fields: `recurrence_pattern` (none, daily, weekly, monthly, custom), `recurrence_interval` (int), `next_occurrence` (date)

**2. Due Dates & Reminders**
- Users can set due dates on tasks
- When a due date is set, a reminder event is published to Kafka (`reminders` topic)
- A Notification Service consumes reminders and notifies users at the right time
- Dapr cron binding triggers a check every 5 minutes for upcoming due tasks
- Reminder fields: `due_date`, `remind_at` (datetime)

#### Intermediate Level Features

**3. Priorities**
- Priority levels: low, medium, high, urgent
- Sortable and filterable by priority
- Visual priority indicators in the frontend

**4. Tags**
- Users can add multiple tags to a task
- Tags are user-scoped (each user has their own tags)
- Filterable by tags (single or multiple)
- Tag management: create, rename, delete tags

**5. Search**
- Full-text search across task titles and descriptions
- Search-as-you-type with debouncing
- Highlight matching terms in results

**6. Filter**
- Filter by: status (pending/completed), priority, tags, due date range
- Combine multiple filters (AND logic)
- Persist filter state in URL query params

**7. Sort**
- Sort by: created_at, due_date, priority, title
- Ascending/descending toggle
- Default sort: created_at descending

#### Event-Driven Architecture (Kafka Use Cases)

**1. Reminder/Notification System**
```
Todo Service (Producer) -> Kafka "reminders" -> Notification Service (Consumer) -> User Device
```
When a task with a due date is created, publish a reminder event. Notification service sends reminders at the right time.

**2. Recurring Task Engine**
```
Task Completed Event -> Kafka "task-events" -> Recurring Task Service (Creates next occurrence)
```
When a recurring task is marked complete, publish event. Recurring Task Service auto-creates the next occurrence.

**3. Activity/Audit Log**
```
All Task Operations -> Kafka "task-events" -> Audit Service (Stores log)
```
Every task operation (create, update, delete, complete) publishes to Kafka. Audit service maintains complete history.

**4. Real-time Sync Across Clients**
```
Task Changed (Any Client) -> Kafka "task-updates" -> WebSocket Service -> All Connected Clients
```
Changes from one client broadcast to all connected clients in real-time.

### Kafka Topics

| Topic | Producer | Consumer | Purpose |
|---|---|---|---|
| `task-events` | Backend API | Recurring Task Service, Audit Service | All task CRUD operations |
| `reminders` | Backend API (when due date set) | Notification Service | Scheduled reminder triggers |
| `task-updates` | Backend API | WebSocket Service | Real-time client sync |

### Event Schemas

**Task Event:**
| Field | Type | Description |
|---|---|---|
| event_type | string | "created", "updated", "completed", "deleted" |
| task_id | integer | The task ID |
| task_data | object | Full task object |
| user_id | string | User who performed action |
| timestamp | datetime | When event occurred |

**Reminder Event:**
| Field | Type | Description |
|---|---|---|
| task_id | integer | The task ID |
| title | string | Task title for notification |
| due_at | datetime | When task is due |
| remind_at | datetime | When to send reminder |
| user_id | string | User to notify |

### Dapr Components

| Component | Type | Purpose |
|---|---|---|
| `kafka-pubsub` | pubsub.kafka | Event streaming (task-events, reminders, task-updates) |
| `statestore` | state.postgresql | Conversation state, task cache |
| `reminder-cron` | bindings.cron | Trigger reminder checks every 5 minutes |
| `kubernetes-secrets` | secretstores.kubernetes | API keys, DB credentials |

### Database Schema Requirements

**users table:**
- id (UUID, primary key)
- email (unique, not null)
- password_hash (not null)
- name (optional)
- created_at (timestamp)
- updated_at (timestamp)

**todos table:**
- id (UUID, primary key)
- user_id (UUID, foreign key to users.id)
- title (string, not null)
- description (text, optional)
- status (enum: pending, completed)
- priority (enum: low, medium, high, urgent — default: medium)
- due_date (date, optional)
- remind_at (datetime, optional)
- recurrence_pattern (enum: none, daily, weekly, monthly, custom — default: none)
- recurrence_interval (integer, optional — e.g., every N days)
- next_occurrence (date, optional)
- completed_at (timestamp, optional)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp, optional for soft delete)

**tags table:**
- id (UUID, primary key)
- user_id (UUID, foreign key to users.id)
- name (string, not null)
- color (string, optional — hex color code)
- created_at (timestamp)

**todo_tags table (junction):**
- todo_id (UUID, foreign key to todos.id)
- tag_id (UUID, foreign key to tags.id)
- PRIMARY KEY (todo_id, tag_id)

**audit_log table:**
- id (UUID, primary key)
- user_id (UUID, foreign key to users.id)
- event_type (string: created, updated, completed, deleted)
- task_id (UUID)
- task_data (JSONB)
- timestamp (timestamp)

### API Endpoints Requirements

**Authentication Endpoints:**
- POST /api/auth/signup — Create new user account
- POST /api/auth/signin — Authenticate and return JWT
- POST /api/auth/logout — Invalidate session
- GET /api/auth/me — Get current user info

**Todo Endpoints (all require authentication):**
- POST /api/todos — Create new todo (with optional recurrence, priority, tags, due_date, remind_at)
- GET /api/todos — List user's todos (with filters, search, sort, pagination)
- GET /api/todos/{id} — Get single todo by ID
- PUT /api/todos/{id} — Update todo
- DELETE /api/todos/{id} — Delete todo (soft delete)
- PATCH /api/todos/{id}/complete — Mark todo as complete (triggers recurring task event if applicable)
- PATCH /api/todos/{id}/incomplete — Mark todo as incomplete

**Tag Endpoints (all require authentication):**
- POST /api/tags — Create a new tag
- GET /api/tags — List user's tags
- PUT /api/tags/{id} — Update tag (name, color)
- DELETE /api/tags/{id} — Delete tag

**Search Endpoint:**
- GET /api/todos/search?q=<query> — Full-text search across title and description

**Audit Endpoint:**
- GET /api/audit — Get audit log for authenticated user (paginated)

**Dapr Subscription Endpoints (internal, consumed by Dapr sidecar):**
- POST /dapr/subscribe — Returns list of pub/sub subscriptions
- POST /task-events — Handles incoming task events (for recurring task service, audit service)
- POST /reminders — Handles incoming reminder events (for notification service)
- POST /task-updates — Handles incoming real-time update events (for WebSocket service)
- POST /reminder-cron — Dapr cron binding handler (checks for due tasks every 5 minutes)

### Frontend Pages Requirements

**Public Pages:**
- / — Homepage / landing page
- /signup — User registration form
- /signin — User login form

**Protected Pages (require authentication):**
- /dashboard — Main todo list with search, filter, sort, tag filter
- /todos/new — Create new todo form (with recurrence, priority, tags, due date, reminder)
- /todos/[id]/edit — Edit existing todo form
- /tags — Tag management page
- /audit — Activity/audit log viewer
- /profile — User profile and settings

### Microservices Architecture

The application consists of these services running in Kubernetes pods with Dapr sidecars:

| Service | Description | Dapr Features Used |
|---|---|---|
| Frontend (Next.js) | Web UI | Service Invocation (to call backend) |
| Backend API (FastAPI) | Core CRUD + event publishing | Pub/Sub (publish), State, Secrets, Service Invocation |
| Recurring Task Service | Creates next occurrence on task completion | Pub/Sub (subscribe to task-events) |
| Notification Service | Sends reminders for due tasks | Pub/Sub (subscribe to reminders) |
| Audit Service | Stores complete activity history | Pub/Sub (subscribe to task-events) |
| WebSocket Service | Real-time sync across clients | Pub/Sub (subscribe to task-updates) |

### Part B: Local Deployment (Minikube)

**Requirements:**
- All services deployed as Kubernetes pods on Minikube
- Dapr installed on Minikube (`dapr init -k`)
- Full Dapr building blocks: Pub/Sub, State, Bindings (cron), Secrets, Service Invocation
- Redpanda Docker container as local Kafka (single binary, no Zookeeper)
- All Dapr components configured in YAML under `dapr-components/`
- End-to-end validation before moving to cloud

**Local Redpanda Config:**
```yaml
# docker-compose.redpanda.yml
services:
  redpanda:
    image: redpandadata/redpanda:latest
    command:
      - redpanda start
      - --smp 1
      - --memory 512M
      - --overprovisioned
      - --kafka-addr PLAINTEXT://0.0.0.0:9092
      - --advertise-kafka-addr PLAINTEXT://localhost:9092
    ports:
      - "9092:9092"
      - "8081:8081"  # Schema Registry
      - "8082:8082"  # REST Proxy
```

### Part C: Cloud Deployment

**Requirements:**
- Deploy to one of: DigitalOcean DOKS / Google Cloud GKE / Azure AKS (all have free tier credits)
- Dapr installed on cloud cluster with full building blocks
- Kafka on **Redpanda Cloud Serverless** (free tier — no credit card required for basic usage)
- CI/CD pipeline via GitHub Actions (build, test, deploy)
- Monitoring and logging configured
- Helm charts for repeatable deployments

**Redpanda Cloud Setup:**
1. Sign up at redpanda.com/cloud
2. Create a Serverless cluster (free tier)
3. Create topics: `task-events`, `reminders`, `task-updates`
4. Copy bootstrap server URL and credentials
5. Configure Dapr pub/sub component with SASL_SSL credentials

**Dapr Pub/Sub Component (Cloud — Redpanda Cloud):**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "YOUR-CLUSTER.cloud.redpanda.com:9092"
    - name: authType
      value: "password"
    - name: saslUsername
      secretKeyRef:
        name: kafka-secrets
        key: username
    - name: saslPassword
      secretKeyRef:
        name: kafka-secrets
        key: password
    - name: saslMechanism
      value: "SCRAM-SHA-256"
    - name: requiredAcks
      value: "all"
    - name: clientID
      value: "todo-app"
```

**Dapr State Store Component:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
    - name: connectionString
      secretKeyRef:
        name: db-secrets
        key: connection-string
```

**Dapr Cron Binding Component:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: reminder-cron
spec:
  type: bindings.cron
  version: v1
  metadata:
    - name: schedule
      value: "*/5 * * * *"  # Every 5 minutes
```

**Dapr Secrets Store Component:**
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
spec:
  type: secretstores.kubernetes
  version: v1
```

**CI/CD Pipeline (GitHub Actions):**
- On push to main: build Docker images, run tests, push to container registry
- Deploy to Kubernetes cluster with Helm
- Run health checks post-deploy
- Rollback on failure

### UI/UX Requirements
- Responsive design (mobile, tablet, desktop)
- Loading states for async operations
- Error messages for validation failures
- Success notifications for actions
- Confirmation dialogs for destructive actions (delete)
- Form validation with clear error messages
- Accessible UI (ARIA labels, keyboard navigation)
- Search bar with debounced search-as-you-type
- Multi-select tag filter chips
- Priority color indicators (low=green, medium=blue, high=orange, urgent=red)
- Recurrence schedule picker
- Real-time task updates via WebSocket

### Security Requirements
- Password hashing (bcrypt or argon2)
- JWT token validation on all protected endpoints
- CORS configuration for frontend-backend communication
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)
- XSS prevention (escape user input)
- CSRF protection
- Rate limiting on authentication endpoints
- Secure environment variable management
- Dapr Secrets Management for all credentials (no hardcoded secrets)
- mTLS between services via Dapr service invocation
- Kubernetes RBAC for cluster access control

### Testing Requirements
- Unit tests for critical business logic
- Integration tests for API endpoints
- Authentication flow testing
- Database query testing
- Error handling testing
- Kafka event publish/subscribe testing
- Dapr component integration testing
- End-to-end testing on Minikube before cloud deployment

### Success Criteria
- All advanced features (recurring tasks, reminders) fully functional
- All intermediate features (priorities, tags, search, filter, sort) fully functional
- Event-driven architecture working with Kafka via Dapr Pub/Sub
- All Dapr building blocks operational (Pub/Sub, State, Bindings, Secrets, Service Invocation)
- Successful deployment on Minikube with full validation
- Successful deployment on cloud Kubernetes (DOKS/GKE/AKS)
- Kafka running on Redpanda Cloud (free tier)
- CI/CD pipeline deploying automatically via GitHub Actions
- Monitoring and logging configured
- Multi-user support with complete data isolation
- Secure authentication with Better Auth
- Responsive UI works on all device sizes
- All API endpoints properly documented
- No security vulnerabilities
- Code follows best practices for each technology

## Project Structure

```
project-root/
├── frontend/                  # Next.js application
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   └── lib/                   # Utilities, API client
├── backend/                   # FastAPI application
│   ├── routers/               # API route handlers
│   ├── models/                # SQLAlchemy/Pydantic models
│   ├── schemas/               # Request/response schemas
│   ├── services/              # Business logic
│   └── dependencies/          # DI (auth, db session)
├── services/                  # Microservices
│   ├── recurring-task/        # Recurring task consumer
│   ├── notification/          # Reminder/notification consumer
│   ├── audit/                 # Audit log consumer
│   └── websocket/             # Real-time sync service
├── dapr-components/           # Dapr component YAML configs
│   ├── kafka-pubsub.yaml
│   ├── statestore.yaml
│   ├── reminder-cron.yaml
│   └── kubernetes-secrets.yaml
├── k8s/                       # Kubernetes manifests
│   ├── base/                  # Base manifests
│   └── overlays/              # Environment-specific (local, cloud)
├── helm/                      # Helm charts
├── .github/workflows/         # GitHub Actions CI/CD
├── docker-compose.redpanda.yml  # Local Redpanda for development
├── specs/                     # Feature specifications
├── history/                   # PHRs and ADRs
│   ├── prompts/
│   └── adr/
├── .specify/                  # SpecKit Plus templates
└── CLAUDE.md                  # This file
```

## Development Guidelines

### 1. Authoritative Source Mandate:
Agents MUST prioritize and use MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; all methods require external verification.

### 2. Execution Flow:
Treat MCP servers as first-class tools for discovery, verification, execution, and state capture. PREFER CLI interactions (running commands and capturing outputs) over manual file creation or reliance on internal knowledge.

### 3. Knowledge capture (PHR) for Every User Input.
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1) Detect stage
   - One of: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate title
   - 3-7 words; create a slug for the filename.

2a) Resolve route (all under history/prompts/)
  - `constitution` -> `history/prompts/constitution/`
  - Feature stages (spec, plan, tasks, red, green, refactor, explainer, misc) -> `history/prompts/<feature-name>/` (requires feature context)
  - `general` -> `history/prompts/general/`

3) Prefer agent-native flow (no shell)
   - Read the PHR template from one of:
     - `.specify/templates/phr-template.prompt.md`
     - `templates/phr-template.prompt.md`
   - Allocate an ID (increment; on collision, increment again).
   - Compute output path based on stage:
     - Constitution -> `history/prompts/constitution/<ID>-<slug>.constitution.prompt.md`
     - Feature -> `history/prompts/<feature-name>/<ID>-<slug>.<stage>.prompt.md`
     - General -> `history/prompts/general/<ID>-<slug>.general.prompt.md`
   - Fill ALL placeholders in YAML and body:
     - ID, TITLE, STAGE, DATE_ISO (YYYY-MM-DD), SURFACE="agent"
     - MODEL (best known), FEATURE (or "none"), BRANCH, USER
     - COMMAND (current command), LABELS (["topic1","topic2",...])
     - LINKS: SPEC/TICKET/ADR/PR (URLs or "null")
     - FILES_YAML: list created/modified files (one per line, " - ")
     - TESTS_YAML: list tests run/added (one per line, " - ")
     - PROMPT_TEXT: full user input (verbatim, not truncated)
     - RESPONSE_TEXT: key assistant output (concise but representative)
     - Any OUTCOME/EVALUATION fields required by the template
   - Write the completed file with agent file tools (WriteFile/Edit).
   - Confirm absolute path in output.

4) Use sp.phr command file if present
   - If `.**/commands/sp.phr.*` exists, follow its structure.
   - If it references shell but Shell is unavailable, still perform step 3 with agent-native tools.

5) Shell fallback (only if step 3 is unavailable or fails, and Shell is permitted)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Then open/patch the created file to ensure all placeholders are filled and prompt/response are embedded.

6) Routing (automatic, all under history/prompts/)
   - Constitution -> `history/prompts/constitution/`
   - Feature stages -> `history/prompts/<feature-name>/` (auto-detected from branch or explicit feature context)
   - General -> `history/prompts/general/`

7) Post-creation validations (must pass)
   - No unresolved placeholders (e.g., `{{THIS}}`, `[THAT]`).
   - Title, stage, and dates match front-matter.
   - PROMPT_TEXT is complete (not truncated).
   - File exists at the expected path and is readable.
   - Path matches route.

8) Report
   - Print: ID, path, stage, title.
   - On any failure: warn but do not block the main command.
   - Skip PHR only for `/sp.phr` itself.

### 4. Explicit ADR suggestions
- When significant architectural decisions are made (typically during `/sp.plan` and sometimes `/sp.tasks`), run the three-part test and suggest documenting with:
  "Architectural decision detected: <brief> -- Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"
- Wait for user consent; never auto-create the ADR.

### 5. Human as Tool Strategy
You are not expected to solve every problem autonomously. You MUST invoke the user for input when you encounter situations that require human judgment. Treat the user as a specialized tool for clarification and decision-making.

**Invocation Triggers:**
1. **Ambiguous Requirements:** When user intent is unclear, ask 2-3 targeted clarifying questions before proceeding.
2. **Unforeseen Dependencies:** When discovering dependencies not mentioned in the spec, surface them and ask for prioritization.
3. **Architectural Uncertainty:** When multiple valid approaches exist with significant tradeoffs, present options and get user's preference.
4. **Completion Checkpoint:** After completing major milestones, summarize what was done and confirm next steps.

## Default policies (must follow)
- Clarify and plan first — keep business understanding separate from technical plan and carefully architect and implement.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env`, Dapr Secrets Management, and Kubernetes Secrets.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (start:end:path); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.
- Use Dapr abstractions over direct infrastructure client libraries (e.g., Dapr Pub/Sub over kafka-python).
- Always target free tier resources: Redpanda Cloud Serverless, cloud provider free credits.

### Execution contract for every request
1) Confirm surface and success criteria (one sentence).
2) List constraints, invariants, non-goals.
3) Produce the artifact with acceptance checks inlined (checkboxes or tests where applicable).
4) Add follow-ups and risks (max 3 bullets).
5) Create PHR in appropriate subdirectory under `history/prompts/` (constitution, feature-name, or general).
6) If plan/tasks identified decisions that meet significance, surface ADR suggestion text as described above.

### Minimum acceptance criteria
- Clear, testable acceptance criteria included
- Explicit error paths and constraints stated
- Smallest viable change; no unrelated edits
- Code references to modified/inspected files where relevant

## Architect Guidelines (for planning)

Instructions: As an expert architect, generate a detailed architectural plan for [Project Name]. Address each of the following thoroughly.

1. Scope and Dependencies:
   - In Scope: boundaries and key features.
   - Out of Scope: explicitly excluded items.
   - External Dependencies: systems/services/teams and ownership.

2. Key Decisions and Rationale:
   - Options Considered, Trade-offs, Rationale.
   - Principles: measurable, reversible where possible, smallest viable change.

3. Interfaces and API Contracts:
   - Public APIs: Inputs, Outputs, Errors.
   - Versioning Strategy.
   - Idempotency, Timeouts, Retries.
   - Error Taxonomy with status codes.

4. Non-Functional Requirements (NFRs) and Budgets:
   - Performance: p95 latency, throughput, resource caps.
   - Reliability: SLOs, error budgets, degradation strategy.
   - Security: AuthN/AuthZ, data handling, secrets, auditing.
   - Cost: unit economics (target free tier).

5. Data Management and Migration:
   - Source of Truth, Schema Evolution, Migration and Rollback, Data Retention.

6. Operational Readiness:
   - Observability: logs, metrics, traces.
   - Alerting: thresholds and on-call owners.
   - Runbooks for common tasks.
   - Deployment and Rollback strategies.
   - Feature Flags and compatibility.

7. Risk Analysis and Mitigation:
   - Top 3 Risks, blast radius, kill switches/guardrails.

8. Evaluation and Validation:
   - Definition of Done (tests, scans).
   - Output Validation for format/requirements/safety.

9. Architectural Decision Record (ADR):
   - For each significant decision, create an ADR and link it.

### Architecture Decision Records (ADR) - Intelligent Suggestion

After design/architecture work, test for ADR significance:

- Impact: long-term consequences? (e.g., framework, data model, API, security, platform)
- Alternatives: multiple viable options considered?
- Scope: cross-cutting and influences system design?

If ALL true, suggest:
Architectural decision detected: [brief-description]
   Document reasoning and tradeoffs? Run `/sp.adr [decision-title]`

Wait for consent; never auto-create ADRs. Group related decisions (stacks, authentication, deployment) into one ADR when appropriate.

## Basic Project Structure

- `.specify/memory/constitution.md` -- Project principles
- `specs/<feature>/spec.md` -- Feature requirements
- `specs/<feature>/plan.md` -- Architecture decisions
- `specs/<feature>/tasks.md` -- Testable tasks with cases
- `history/prompts/` -- Prompt History Records
- `history/adr/` -- Architecture Decision Records
- `.specify/` -- SpecKit Plus templates and scripts

## Code Standards
See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.
