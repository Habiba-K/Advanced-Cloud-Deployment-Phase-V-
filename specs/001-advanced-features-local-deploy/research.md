# Research: Advanced Features & Local Deployment

**Feature**: 001-advanced-features-local-deploy
**Date**: 2026-02-08

## R1: Dapr Pub/Sub Integration with FastAPI

**Decision**: Use httpx to make HTTP POST calls to Dapr sidecar at `http://localhost:3500/v1.0/publish/{pubsubname}/{topic}` for publishing events. For subscribing, implement a `/dapr/subscribe` GET endpoint that returns subscription metadata, and topic handler POST endpoints.

**Rationale**: Dapr provides a simple HTTP API that requires no Kafka-specific libraries. httpx is already a common async HTTP client in the Python ecosystem. FastAPI natively handles the subscription endpoints.

**Alternatives considered**:
- kafka-python / aiokafka: Rejected — violates Constitution Principle IV (Dapr-Abstracted Infrastructure)
- dapr Python SDK: Considered but adds unnecessary dependency. Raw HTTP via httpx is simpler and more transparent.
- grpc-based Dapr client: Rejected — HTTP is sufficient for this scale and simpler to debug

## R2: Dapr Subscription Pattern for Consumer Services

**Decision**: Each consumer service is a lightweight FastAPI app that exposes:
1. `GET /dapr/subscribe` — returns JSON array of subscriptions (pubsubname, topic, route)
2. `POST /{topic}` — handles incoming events from Dapr

**Rationale**: This is the programmatic subscription model recommended by Dapr docs. Each service subscribes to specific topics and Dapr routes events to the correct handler endpoint. No configuration files needed beyond the Dapr component YAML.

**Alternatives considered**:
- Declarative subscription (YAML-based): Simpler but less flexible for dynamic routing
- Streaming subscription: Not needed at this scale; HTTP push model is sufficient

## R3: Redpanda as Local Kafka Replacement

**Decision**: Use Redpanda Docker container (`redpandadata/redpanda:latest`) as the local Kafka-compatible broker for Minikube development.

**Rationale**: Redpanda is a single binary, Kafka-compatible, requires no Zookeeper, uses less memory (512MB), and supports the same protocol. Dapr's `pubsub.kafka` component works with Redpanda unchanged. For cloud, Redpanda Cloud Serverless (free tier) provides the same compatibility.

**Alternatives considered**:
- Apache Kafka (Bitnami Helm): Requires Zookeeper, higher memory footprint (~2GB), complex setup
- Strimzi Operator: Production-grade but overkill for local development
- RabbitMQ: Not Kafka-compatible; would require changing Dapr component type

## R4: Database Schema Migration Strategy

**Decision**: Extend the existing Task model by adding new columns (priority, due_date, remind_at, recurrence_pattern, recurrence_interval, next_occurrence, completed_at, deleted_at) and create new tables (tags, todo_tags, audit_log). Use SQLModel's `create_all` for initial setup (existing pattern), with Alembic for future migrations.

**Rationale**: The existing codebase uses `SQLModel.metadata.create_all` on startup. Adding columns and new tables follows the same pattern. Alembic can be added later for production migration management.

**Alternatives considered**:
- Alembic from day one: More robust but adds complexity for initial development
- Manual SQL migrations: Error-prone and not trackable
- Separate database per service: Overcomplicated for this scale; single Neon DB is sufficient

## R5: Search Implementation

**Decision**: Use PostgreSQL `ILIKE` for text search across task title and description fields. Combine with query builder pattern for filter/sort parameters.

**Rationale**: For 100-1000 tasks per user, ILIKE with proper indexes is performant enough. PostgreSQL's built-in text search (tsvector/tsquery) can be added later if needed. No external search engine required.

**Alternatives considered**:
- PostgreSQL full-text search (tsvector): More powerful but adds schema complexity; defer to later optimization
- Elasticsearch: Overkill for this scale; adds infrastructure cost
- Client-side filtering: Not scalable; must be server-side

## R6: Real-Time Sync Architecture

**Decision**: WebSocket Service subscribes to `task-updates` topic via Dapr Pub/Sub. When an event arrives, it broadcasts to all WebSocket connections for that user_id. Frontend establishes WebSocket connection on dashboard load.

**Rationale**: WebSocket provides true bidirectional real-time communication. The Kafka-to-WebSocket bridge pattern is standard for event-driven real-time systems. Each user maintains their own WebSocket connection(s).

**Alternatives considered**:
- Server-Sent Events (SSE): Simpler but one-directional; WebSocket is more flexible
- Polling: Not real-time; wastes bandwidth
- Direct Kafka consumer in frontend: Not possible in browser; violates architecture

## R7: Helm Chart Structure

**Decision**: Single Helm chart (`todo-app`) with templates for all 6 services, Dapr components, and K8s resources. Use `values.yaml` for defaults and `values-local.yaml` for Minikube-specific overrides (image pull policy, resource limits).

**Rationale**: Single chart simplifies deployment with one `helm install` command. Values overrides allow environment-specific configuration without duplicating templates.

**Alternatives considered**:
- Separate charts per service: More modular but harder to coordinate deployments
- Kustomize only (no Helm): Less flexible for parameterization
- Docker Compose on Minikube: Doesn't leverage K8s features (Dapr sidecar injection, readiness probes)

## R8: Dapr Cron Binding for Reminders

**Decision**: Use Dapr `bindings.cron` component with schedule `*/5 * * * *` (every 5 minutes). Dapr invokes `POST /reminder-cron` on the backend service. The handler queries the database for tasks with `remind_at` within the next 5 minutes and publishes reminder events.

**Rationale**: Dapr cron bindings provide reliable scheduled execution without external cron infrastructure. The 5-minute window matches the spec requirement and balances timeliness with database load.

**Alternatives considered**:
- In-app scheduler (APScheduler): Not Kubernetes-native; doesn't survive pod restarts
- Kubernetes CronJob: Works but adds another manifest type; Dapr binding is simpler
- External cron service: Unnecessary dependency

## R9: Event Idempotency Strategy

**Decision**: Each consumer service stores a processed event ID (using the Kafka message offset or a UUID in the event payload) in either the database or Dapr state store. Before processing, check if the event was already handled. Skip if duplicate.

**Rationale**: Kafka (and Dapr Pub/Sub) provides at-least-once delivery. Without idempotency checks, duplicate events could create duplicate recurring tasks or audit entries.

**Alternatives considered**:
- Exactly-once semantics: Not supported by Dapr Pub/Sub; at-least-once + idempotency is the standard pattern
- Unique constraints in DB: Works for audit log (unique event_id) but not sufficient for all consumers

## R10: Notification Delivery Mechanism

**Decision**: In-app notifications via WebSocket push. The Notification Service receives reminder events, checks if the task is still pending (not completed), and publishes a notification event to the `task-updates` topic which the WebSocket Service broadcasts to the user's connected clients.

**Rationale**: In-app notifications require no external services (email, push) and work within the existing WebSocket infrastructure. The spec explicitly states "in-app notification" (not email/push).

**Alternatives considered**:
- Email notifications: Requires email service integration; not in scope
- Browser push notifications: Requires service worker; adds complexity
- Polling for notifications: Not real-time; bad UX
