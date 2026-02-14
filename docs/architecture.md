# TaskFlow Architecture Documentation

## System Architecture Diagrams

### 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Browser                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   React UI   │  │  WebSocket   │  │   HTTP API   │             │
│  │  Components  │  │    Client    │  │    Client    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          │ HTTP/HTTPS       │ WebSocket        │ REST API
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────────────┐
│                      Next.js Frontend (Port 3000)                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  App Router │ Server Components │ Client Components        │    │
│  │  Tailwind CSS │ TypeScript │ React Hooks │ Context API     │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTP (Port 8000)
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Routers │ Services │ Models │ Schemas │ Dependencies      │     │
│  │  JWT Auth │ Pydantic Validation │ SQLModel ORM             │     │
│  └────────┬───────────────────────────────────┬───────────────┘     │
│           │                                   │                      │
│           │ Dapr HTTP API                     │ Database Queries     │
│           │ (localhost:3500)                  │                      │
└───────────┼───────────────────────────────────┼──────────────────────┘
            │                                   │
            │                                   │
    ┌───────▼────────┐                 ┌────────▼─────────┐
    │  Dapr Sidecar  │                 │  Neon Postgres   │
    │  (Port 3500)   │                 │   (Serverless)   │
    │                │                 │                  │
    │ • Pub/Sub      │                 │ • tasks table    │
    │ • State Store  │                 │ • users table    │
    │ • Secrets      │                 │ • tags table     │
    │ • Bindings     │                 │ • audit_log      │
    │ • Service Call │                 │ • indexes        │
    └───────┬────────┘                 └──────────────────┘
            │
            │ Kafka Protocol
            │
    ┌───────▼────────────────────────────────────────────┐
    │         Kafka / Redpanda (Message Broker)          │
    │                                                     │
    │  Topics:                                            │
    │  • task-events (all CRUD operations)               │
    │  • reminders (scheduled notifications)             │
    │  • task-updates (real-time sync)                   │
    └───────┬────────────────────────────────────────────┘
            │
            │ Pub/Sub Subscribe
            │
    ┌───────┴─────────┬──────────────┬──────────────┐
    │                 │              │              │
┌───▼────────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│Notification│  │Recurring │  │  Audit   │  │WebSocket │
│  Service   │  │  Task    │  │ Service  │  │ Service  │
│            │  │ Service  │  │          │  │          │
│• Consumes  │  │• Consumes│  │• Consumes│  │• Consumes│
│  reminders │  │  task-   │  │  task-   │  │  task-   │
│• Sends     │  │  events  │  │  events  │  │  updates │
│  notifs    │  │• Creates │  │• Stores  │  │• Broadcasts│
│• Publishes │  │  next    │  │  history │  │  to clients│
│  to task-  │  │  occur   │  │          │  │          │
│  updates   │  │          │  │          │  │          │
└────────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 2. Event Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event-Driven Flow                             │
└─────────────────────────────────────────────────────────────────┘

1. Task Creation Flow:
   ┌──────────┐    POST /tasks    ┌──────────┐
   │  Client  │ ─────────────────> │ Backend  │
   └──────────┘                    └────┬─────┘
                                        │
                                        │ 1. Save to DB
                                        │ 2. Publish event
                                        ▼
                                   ┌─────────────┐
                                   │ Dapr Sidecar│
                                   └──────┬──────┘
                                          │
                                          │ Publish to topic
                                          ▼
                                   ┌──────────────┐
                                   │    Kafka     │
                                   │ task-events  │
                                   └──────┬───────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                        ▼                 ▼                 ▼
                  ┌──────────┐      ┌──────────┐    ┌──────────┐
                  │  Audit   │      │WebSocket │    │ (Future) │
                  │ Service  │      │ Service  │    │ Services │
                  └────┬─────┘      └────┬─────┘    └──────────┘
                       │                 │
                       │ Store log       │ Broadcast
                       ▼                 ▼
                  ┌──────────┐      ┌──────────┐
                  │ Database │      │ Connected│
                  │audit_log │      │ Clients  │
                  └──────────┘      └──────────┘

2. Task Completion Flow (Recurring Tasks):
   ┌──────────┐  PATCH /complete  ┌──────────┐
   │  Client  │ ─────────────────> │ Backend  │
   └──────────┘                    └────┬─────┘
                                        │
                                        │ 1. Update status
                                        │ 2. Set completed_at
                                        │ 3. Publish event
                                        ▼
                                   ┌─────────────┐
                                   │ Dapr Sidecar│
                                   └──────┬──────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │    Kafka     │
                                   │ task-events  │
                                   │ type:completed│
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  Recurring   │
                                   │Task Service  │
                                   └──────┬───────┘
                                          │
                                          │ If recurrence_pattern != 'none'
                                          │ Calculate next_occurrence
                                          │ Create new task via Dapr
                                          ▼
                                   ┌──────────────┐
                                   │ Dapr Service │
                                   │  Invocation  │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │   Backend    │
                                   │ POST /tasks  │
                                   └──────────────┘

3. Reminder Flow:
   ┌──────────┐                    ┌──────────┐
   │  Dapr    │  Every 5 minutes   │Notification│
   │  Cron    │ ──────────────────>│  Service   │
   │ Binding  │                    └──────┬─────┘
   └──────────┘                           │
                                          │ Query DB for
                                          │ due tasks
                                          ▼
                                   ┌──────────────┐
                                   │   Database   │
                                   │ WHERE due_date│
                                   │ < NOW() + 1h │
                                   └──────┬───────┘
                                          │
                                          │ For each task
                                          ▼
                                   ┌──────────────┐
                                   │ Publish to   │
                                   │  reminders   │
                                   │    topic     │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ Notification │
                                   │   Service    │
                                   │  (Consumer)  │
                                   └──────┬───────┘
                                          │
                                          │ Send notification
                                          │ Publish to task-updates
                                          ▼
                                   ┌──────────────┐
                                   │  WebSocket   │
                                   │   Service    │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │   Clients    │
                                   │ (Toast notif)│
                                   └──────────────┘
```

### 3. Dapr Building Blocks Usage

```
┌─────────────────────────────────────────────────────────────────┐
│                  Dapr Building Blocks in TaskFlow                │
└─────────────────────────────────────────────────────────────────┘

1. Pub/Sub (kafka-pubsub component)
   ┌──────────────────────────────────────────────────────────┐
   │  Publishers:                                              │
   │  • Backend API → task-events, reminders, task-updates    │
   │  • Notification Service → task-updates                   │
   │                                                           │
   │  Subscribers:                                             │
   │  • Recurring Task Service ← task-events                  │
   │  • Audit Service ← task-events                           │
   │  • Notification Service ← reminders                      │
   │  • WebSocket Service ← task-updates                      │
   └──────────────────────────────────────────────────────────┘

2. State Management (statestore component)
   ┌──────────────────────────────────────────────────────────┐
   │  Use Cases:                                               │
   │  • Conversation state for AI chat                        │
   │  • Task cache for performance                            │
   │  • Session data                                          │
   │                                                           │
   │  Backend: PostgreSQL state store                         │
   └──────────────────────────────────────────────────────────┘

3. Bindings (reminder-cron component)
   ┌──────────────────────────────────────────────────────────┐
   │  Cron Schedule: */5 * * * * (every 5 minutes)            │
   │                                                           │
   │  Triggers: Notification Service                          │
   │  Action: Check for upcoming due tasks and send reminders │
   └──────────────────────────────────────────────────────────┘

4. Secrets Management (kubernetes-secrets component)
   ┌──────────────────────────────────────────────────────────┐
   │  Secrets Stored:                                          │
   │  • Database connection string                            │
   │  • JWT secret key                                        │
   │  • Kafka credentials (for cloud deployment)             │
   │  • API keys                                              │
   └──────────────────────────────────────────────────────────┘

5. Service Invocation
   ┌──────────────────────────────────────────────────────────┐
   │  Use Case: Recurring Task Service → Backend API          │
   │                                                           │
   │  Flow:                                                    │
   │  1. Recurring Task Service receives completed event      │
   │  2. Calculates next occurrence date                      │
   │  3. Invokes Backend API via Dapr:                        │
   │     POST http://localhost:3500/v1.0/invoke/backend/      │
   │          method/api/{user_id}/tasks                      │
   │  4. Backend creates new task instance                    │
   │                                                           │
   │  Benefits:                                                │
   │  • Built-in retries with exponential backoff             │
   │  • mTLS encryption between services                      │
   │  • Service discovery                                     │
   │  • Distributed tracing                                   │
   └──────────────────────────────────────────────────────────┘
```

### 4. Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Database Schema                             │
└─────────────────────────────────────────────────────────────────┘

users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE, NOT NULL)
├── password_hash (VARCHAR, NOT NULL)
├── name (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

tasks
├── id (UUID, PK)
├── user_id (VARCHAR, FK → users.id, INDEXED)
├── title (VARCHAR(500), NOT NULL)
├── description (TEXT)
├── completed (BOOLEAN, default: false) [DEPRECATED]
├── status (ENUM: pending/completed, INDEXED)
├── priority (ENUM: low/medium/high/urgent, INDEXED)
├── due_date (DATE, INDEXED)
├── remind_at (TIMESTAMP, INDEXED)
├── recurrence_pattern (ENUM: none/daily/weekly/monthly)
├── recurrence_interval (INTEGER, default: 1)
├── next_occurrence (DATE)
├── completed_at (TIMESTAMP)
├── deleted_at (TIMESTAMP, INDEXED) [Soft Delete]
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

tags
├── id (UUID, PK)
├── user_id (VARCHAR, FK → users.id)
├── name (VARCHAR(50), NOT NULL)
├── color (VARCHAR(7)) [Hex color]
└── created_at (TIMESTAMP)

todo_tags (Junction Table)
├── todo_id (UUID, FK → tasks.id)
├── tag_id (UUID, FK → tags.id)
└── PRIMARY KEY (todo_id, tag_id)

audit_log
├── id (UUID, PK)
├── user_id (VARCHAR, FK → users.id)
├── event_type (VARCHAR: created/updated/completed/deleted)
├── task_id (UUID)
├── task_data (JSONB) [Complete task snapshot]
├── event_id (VARCHAR, UNIQUE) [Idempotency key]
└── timestamp (TIMESTAMP)

Indexes:
• tasks(user_id) - Filter by user
• tasks(status) - Filter by completion status
• tasks(priority) - Filter by priority
• tasks(due_date) - Sort and filter by due date
• tasks(deleted_at) - Exclude soft-deleted tasks
• tasks(remind_at) - Query for upcoming reminders
• audit_log(user_id, timestamp) - Paginated audit queries
```

### 5. Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
└─────────────────────────────────────────────────────────────────┘

1. Authentication & Authorization
   ┌──────────────────────────────────────────────────────────┐
   │  Client Request                                           │
   │  └─> JWT Token in Authorization header                   │
   │       └─> Backend validates token                        │
   │            └─> Extracts user_id                          │
   │                 └─> All queries filtered by user_id      │
   └──────────────────────────────────────────────────────────┘

2. Input Sanitization (Frontend)
   ┌──────────────────────────────────────────────────────────┐
   │  • sanitizeTaskTitle() - Remove XSS vectors              │
   │  • sanitizeTaskDescription() - Strip dangerous HTML      │
   │  • sanitizeSearchQuery() - Limit length, remove scripts  │
   │  • sanitizeTagName() - Validate and clean tag names      │
   │  • escapeHtml() - Escape special characters              │
   └──────────────────────────────────────────────────────────┘

3. Input Validation (Backend)
   ┌──────────────────────────────────────────────────────────┐
   │  • Pydantic models validate all request data             │
   │  • Max length constraints on all string fields           │
   │  • Enum validation for status, priority, recurrence      │
   │  • Date validation for due_date and remind_at            │
   │  • SQL injection prevention via parameterized queries    │
   └──────────────────────────────────────────────────────────┘

4. CORS Configuration
   ┌──────────────────────────────────────────────────────────┐
   │  Allowed Origins: Configured via CORS_ORIGINS env var    │
   │  Allowed Methods: GET, POST, PUT, PATCH, DELETE          │
   │  Allowed Headers: Authorization, Content-Type, etc.      │
   │  Credentials: Enabled for cookie-based auth              │
   └──────────────────────────────────────────────────────────┘

5. Secrets Management
   ┌──────────────────────────────────────────────────────────┐
   │  Development: .env files (gitignored)                    │
   │  Production: Kubernetes Secrets + Dapr Secrets Store     │
   │  • Database credentials                                  │
   │  • JWT signing key                                       │
   │  • Kafka credentials                                     │
   │  • API keys                                              │
   └──────────────────────────────────────────────────────────┘

6. Network Security (Kubernetes)
   ┌──────────────────────────────────────────────────────────┐
   │  • mTLS between services via Dapr                        │
   │  • Network policies to restrict pod communication        │
   │  • Ingress TLS termination                               │
   │  • Service mesh for encrypted traffic                    │
   └──────────────────────────────────────────────────────────┘
```

### 6. Deployment Architecture (Kubernetes)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster (Minikube/Cloud)             │
└─────────────────────────────────────────────────────────────────┘

Namespace: taskflow
│
├── Deployments
│   ├── frontend (Next.js)
│   │   ├── Replicas: 2
│   │   ├── Container: frontend:latest
│   │   ├── Dapr Sidecar: ✓
│   │   ├── Resources: 256Mi RAM, 0.25 CPU
│   │   └── Probes: liveness, readiness
│   │
│   ├── backend (FastAPI)
│   │   ├── Replicas: 3
│   │   ├── Container: backend:latest
│   │   ├── Dapr Sidecar: ✓ (app-id: backend, port: 8000)
│   │   ├── Resources: 512Mi RAM, 0.5 CPU
│   │   └── Probes: /health/live, /health/ready
│   │
│   ├── notification-service
│   │   ├── Replicas: 2
│   │   ├── Container: notification:latest
│   │   ├── Dapr Sidecar: ✓ (app-id: notification)
│   │   ├── Resources: 256Mi RAM, 0.25 CPU
│   │   └── Subscriptions: reminders topic
│   │
│   ├── recurring-task-service
│   │   ├── Replicas: 2
│   │   ├── Container: recurring-task:latest
│   │   ├── Dapr Sidecar: ✓ (app-id: recurring-task)
│   │   ├── Resources: 256Mi RAM, 0.25 CPU
│   │   └── Subscriptions: task-events topic
│   │
│   ├── audit-service
│   │   ├── Replicas: 2
│   │   ├── Container: audit:latest
│   │   ├── Dapr Sidecar: ✓ (app-id: audit)
│   │   ├── Resources: 256Mi RAM, 0.25 CPU
│   │   └── Subscriptions: task-events topic
│   │
│   ├── websocket-service
│   │   ├── Replicas: 2
│   │   ├── Container: websocket:latest
│   │   ├── Dapr Sidecar: ✓ (app-id: websocket)
│   │   ├── Resources: 256Mi RAM, 0.25 CPU
│   │   └── Subscriptions: task-updates topic
│   │
│   └── redpanda (Local only)
│       ├── Replicas: 1
│       ├── Container: redpanda:latest
│       ├── Resources: 1Gi RAM, 1 CPU
│       └── Ports: 9092 (Kafka), 8081 (Schema Registry)
│
├── Services
│   ├── frontend (ClusterIP, Port 3000)
│   ├── backend (ClusterIP, Port 8000)
│   ├── websocket (ClusterIP, Port 8001)
│   └── redpanda (ClusterIP, Port 9092)
│
├── ConfigMaps
│   ├── app-config (environment variables)
│   └── dapr-config (Dapr configuration)
│
├── Secrets
│   ├── db-secrets (database connection string)
│   ├── jwt-secrets (JWT signing key)
│   └── kafka-secrets (Kafka credentials for cloud)
│
├── Dapr Components
│   ├── kafka-pubsub (pubsub.kafka)
│   ├── statestore (state.postgresql)
│   ├── reminder-cron (bindings.cron)
│   └── kubernetes-secrets (secretstores.kubernetes)
│
└── Ingress
    ├── taskflow-ingress
    │   ├── Host: taskflow.example.com
    │   ├── TLS: ✓
    │   ├── Rules:
    │   │   ├── / → frontend:3000
    │   │   ├── /api → backend:8000
    │   │   └── /ws → websocket:8001
    │   └── Annotations: nginx.ingress.kubernetes.io/*
    └── Cert-Manager (for TLS certificates)
```

## Performance Considerations

### Database Optimization
- **Indexes:** All frequently queried columns (user_id, status, priority, due_date, deleted_at) have indexes
- **Connection Pooling:** Neon Serverless PostgreSQL with pgbouncer for efficient connection management
- **Query Optimization:** Avoid N+1 queries, use JOINs efficiently, limit result sets

### Caching Strategy
- **Dapr State Store:** Cache frequently accessed data (user sessions, task lists)
- **Client-side:** React Query for automatic caching and background refetching
- **CDN:** Static assets served via CDN in production

### Scalability
- **Horizontal Scaling:** All services can scale independently via Kubernetes HPA
- **Kafka Partitioning:** Topics partitioned by user_id for parallel processing
- **Database:** Neon Serverless auto-scales based on load
- **Stateless Services:** All services are stateless for easy scaling

### Monitoring & Observability
- **Structured Logging:** JSON logs with correlation IDs for distributed tracing
- **Health Checks:** Liveness and readiness probes for all services
- **Metrics:** Prometheus metrics exposed by Dapr sidecars
- **Distributed Tracing:** Dapr automatic tracing with Zipkin/Jaeger integration

## Disaster Recovery

### Backup Strategy
- **Database:** Neon automatic daily backups with point-in-time recovery
- **Kafka:** Redpanda Cloud automatic replication across availability zones
- **Configuration:** All Kubernetes manifests and Helm charts in Git

### High Availability
- **Multi-replica Deployments:** All services run with 2+ replicas
- **Pod Disruption Budgets:** Ensure minimum availability during updates
- **Health Checks:** Automatic pod restart on failure
- **Load Balancing:** Kubernetes Service load balancing across pods

### Rollback Procedures
- **Helm Rollback:** `helm rollback taskflow <revision>`
- **Kubernetes Rollout:** `kubectl rollout undo deployment/<name>`
- **Database Migrations:** Reversible migrations with down() methods
- **Feature Flags:** Gradual rollout and instant rollback capability
