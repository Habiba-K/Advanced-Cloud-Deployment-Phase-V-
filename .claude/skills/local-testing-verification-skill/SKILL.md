---
name: local-testing-verification-skill
description: Test and verify Phase V Todo app features locally on Minikube, ensuring Dapr, Kafka, backend, and frontend functionalities work correctly. Use when validating reminders, recurring tasks, and event-driven architecture before cloud deployment.
---

# Local Testing & Verification Skill

## Instructions

Test and validate the Todo app locally with these capabilities:

1. **Minikube Cluster Management**
   - Start and configure local Kubernetes cluster using Minikube
   - Ensure all pods (backend, frontend, Dapr sidecars) are running
   - Apply Helm charts with Dapr annotations for local deployment

2. **Dapr Integration Testing**
   - Verify Pub/Sub events are published and consumed correctly
     - `task-events`, `reminders`, `task-updates`
   - Confirm state management works for task cache and conversation state
   - Test cron bindings for scheduled reminders
   - Check secrets management works with local Kubernetes secrets

3. **Kafka Topic Verification**
   - Confirm local Redpanda Docker topics exist and events are being sent/received
   - Validate event flow to Notification Service, Recurring Task Service, Audit Service, and WebSocket service

4. **FastAPI Backend Testing**
   - Test task creation, updates, deletions, and completion
   - Verify recurring tasks auto-create correctly
   - Check reminder events trigger properly
   - Ensure audit logging captures all operations

5. **Frontend Functional Testing**
   - Verify forms for creating tasks with priority, tags, and due dates
   - Check search, filter, and sort functionality
   - Confirm real-time updates broadcast to all connected clients
   - Validate user interface responds correctly to backend events

6. **Reporting & Debugging**
   - Generate logs for Dapr sidecars, Kafka, and backend
   - Identify and suggest fixes for failing tests
   - Produce a local deployment guide for cloud migration

## Example Minikube & Dapr Testing Commands

```bash
# Start Minikube cluster
minikube start

# Deploy backend & frontend with Dapr enabled
helm install todo-backend ./charts/backend --set dapr.enabled=true
helm install todo-frontend ./charts/frontend --set dapr.enabled=true

# Verify Dapr sidecars
kubectl get pods -n default

# Check Kafka topics (Redpanda Docker)
docker exec -it redpanda rpk topic list
docker exec -it redpanda rpk topic consume task-events
