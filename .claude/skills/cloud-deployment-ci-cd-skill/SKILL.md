---
name: cloud-deployment-ci-cd-skill
description: Deploy and manage the Todo app on cloud Kubernetes clusters with Dapr integration, CI/CD pipelines, and monitoring. Use when moving from local Minikube to production-grade cloud deployment.
---

# Cloud Deployment & CI/CD Skill

## Instructions

Deploy and manage Phase V Todo app on cloud with these capabilities:

1. **Kubernetes Cluster Management**
   - Create and configure clusters on DigitalOcean (DOKS), GKE, or AKS using free-tier credits
   - Configure `kubectl` for cluster access
   - Verify nodes and pods are running correctly
   - Scale deployments for performance testing

2. **Helm Charts & Dapr Annotations**
   - Enable Dapr on backend/frontend via Helm annotations:
     ```yaml
     dapr.io/enabled: "true"
     dapr.io/app-id: "todo-backend"
     dapr.io/app-port: "8000"
     ```
   - Deploy Dapr components (pubsub.kafka, state.postgresql, bindings.cron, secretstores.kubernetes)
   - Ensure consistency between local Minikube and cloud deployments

3. **GitHub Actions Pipelines**
   - Build Docker images for backend and frontend
   - Push images to Docker Hub
   - Deploy to Kubernetes cluster via `kubectl` in workflow
   - Manage secrets securely (COHERE_API_KEY, DB credentials)
   - Automate CI/CD for fast iterative deployment

4. **Cloud-Native Monitoring**
   - Enable metrics collection using Prometheus + Grafana or cloud-native monitoring tools
   - Track Dapr Pub/Sub events, task processing, and service health
   - Alert on failures or service downtime

5. **Redpanda Cloud Integration**
   - Use Redpanda Cloud serverless for Kafka topics (`task-events`, `reminders`, `task-updates`)
   - Connect Dapr Pub/Sub component to Redpanda cluster
   - Ensure all events are reliably published and consumed

6. **Dapr Full Runtime**
   - Pub/Sub: abstract Kafka events via Dapr
   - State: task cache, conversation history
   - Bindings: cron triggers for reminders
   - Secrets: securely store API keys and credentials
   - Service Invocation: enable frontend → backend communication with retries and automatic discovery

## Example Helm Deployment Commands

```bash
# Deploy backend with Dapr enabled
helm install todo-backend ./charts/backend \
  --set image.tag=latest \
  --set dapr.enabled=true \
  --set dapr.appId=todo-backend \
  --set dapr.appPort=8000

# Deploy frontend
helm install todo-frontend ./charts/frontend \
  --set image.tag=latest
