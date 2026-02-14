---
id: 004
title: Phase V Constitution Update
stage: constitution
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: none
branch: 001-advanced-features-local-deploy
user: User
command: /sp.constitution
labels: ["constitution", "phase-v", "event-driven", "dapr", "kafka", "kubernetes", "minikube", "cloud-deployment", "free-tier"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

Phase-V

# Version
v5.0

# Purpose
Implement advanced Todo app features with event-driven architecture, deploy locally on Minikube, then to cloud Kubernetes with full Dapr runtime, CI/CD, and monitoring.

# Rules

## Advanced Features
- Recurring tasks: daily / weekly / monthly
- Task due dates & automated reminders
- Task priority: High / Medium / Low
- Tags: Work / Home / Personal
- Search, filter, sort tasks by date, priority, title

## Event-Driven Architecture
- Kafka topics: task-events, reminders, task-updates
- Publish & consume via Dapr Pub/Sub
- Audit logging and real-time client sync

## Dapr Usage
- Pub/Sub: abstract Kafka communication
- State: task cache, conversation history
- Cron Bindings: scheduled reminders
- Secrets: API keys, DB credentials
- Service Invocation: frontend to backend with automatic retries

## Local Deployment
- Minikube cluster
- Dapr sidecar enabled
- Redpanda Docker for Kafka
- Neon DB free-tier
- Helm charts with Dapr annotations

## Cloud Deployment
- Kubernetes cluster: DOKS / GKE / AKS
- Backend & frontend deployment via Helm
- Dapr full runtime enabled
- Redpanda Cloud serverless for Kafka
- CI/CD via GitHub Actions
  - Build Docker images
  - Push to Docker Hub
  - Deploy to Kubernetes
  - Manage secrets securely
- Monitoring: cloud-native or Prometheus + Grafana
- Alerts for failures and downtime

# Guidelines
- Use free-tier services wherever possible
- Abstract infrastructure via Dapr; no direct Kafka or DB code
- Follow Spec-Driven Development strictly: /sp.specify, /sp.plan, /sp.tasks
- Test locally before cloud deployment

## Response snapshot

Updated constitution from v2.0.0 (Phase-III AI Chatbot with MCP/OpenAI) to v5.0.0 (Phase-V Advanced Cloud Deployment). MAJOR version bump. 10 core principles: Security-First Design, Event-Driven Architecture, Clean Separation of Concerns, Dapr-Abstracted Infrastructure, Advanced Task Management Features, Database as Single Source of Truth, Maintainability and Testability, Local-First Deployment, Cloud-Ready Deployment, Free-Tier Resource Strategy. Removed all Phase-III-specific sections (MCP tools, OpenAI Agents SDK, ChatKit, conversation-driven design). Added Kafka topics/events, Dapr building blocks, microservices architecture, local/cloud deployment, CI/CD, and monitoring requirements.

## Outcome

- Impact: Complete constitution rewrite for Phase V event-driven microservices architecture with Dapr and Kubernetes
- Tests: none (governance document)
- Files: .specify/memory/constitution.md
- Next prompts: Resume /sp.plan for feature 001-advanced-features-local-deploy
- Reflection: MAJOR version bump justified by complete architectural redefinition (7 of 7 original principles modified or replaced, 3 new principles added)

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): No remaining bracket tokens PASS, version matches report PASS, dates ISO format PASS, principles declarative and testable PASS
- Prompt variant (if applicable): standard /sp.constitution flow
- Next experiment (smallest change to try): none needed
