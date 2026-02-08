---
name: dapr-kafka-integration-skill
description: Configure and manage Dapr components and Kafka for event-driven architecture in the Todo app. Use when setting up Pub/Sub, State, Bindings, Secrets, and service invocation for local or cloud deployment.
---

# Dapr + Kafka Integration Skill

## Instructions

Set up and manage Dapr + Kafka integration with these capabilities:

1. **Dapr Sidecar Setup**
   - Install Dapr CLI locally or on Kubernetes
   - Run Dapr sidecar alongside backend services
   - Annotate Helm charts to enable Dapr (`dapr.io/enabled: "true"`, app-id, app-port)

2. **Event-Driven Architecture**
   - Configure Kafka topics: `task-events`, `reminders`, `task-updates`
   - Abstract all Kafka interactions through Dapr Pub/Sub (no direct Kafka code)
   - Ensure consumers are properly configured for:
     - Notification Service
     - Recurring Task Service
     - Audit Service
     - WebSocket Service for real-time sync

3. **Dapr Components Configuration**
   - **pubsub.kafka**: Dapr Pub/Sub component for Kafka topics
   - **state.postgresql**: Dapr state management for task cache and conversation state
   - **bindings.cron**: Trigger scheduled reminders
   - **secretstores.kubernetes**: Store API keys, DB credentials securely

4. **FastAPI Service Invocation**
   - Enable frontend → backend communication through Dapr service invocation
   - Include automatic retries and service discovery

5. **Free-Tier Setup Recommendations**
   - Local: Minikube + Redpanda Docker + Neon DB free tier
   - Cloud: DigitalOcean DOKS / GKE / AKS + Redpanda Cloud serverless + Neon DB
   - Avoid direct Kafka or DB connection strings in code

6. **Kubernetes Deployment**
   - Apply Dapr component YAMLs via `kubectl apply`
   - Verify Dapr sidecars are running and communicating
   - Scale services using Kubernetes deployments
   - Maintain consistent configuration between local and cloud environments

## Example Dapr Component Configuration

```yaml
# Kafka Pub/Sub
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "localhost:9092"
  - name: consumerGroup
    value: "todo-service"

# State Management (PostgreSQL)
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
  - name: connectionString
    value: "host=neon.db user=... password=... dbname=todo"
