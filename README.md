# TaskFlow - Advanced Cloud Deployment (Phase V)

A full-stack, event-driven task management application with real-time synchronization, recurring tasks, reminders, and comprehensive audit logging.

## 🚀 Features

### Core Features
- ✅ User authentication with Better Auth (JWT-based)
- ✅ CRUD operations for tasks with multi-user support
- ✅ Priority levels (low, medium, high, urgent)
- ✅ Tag system for task organization
- ✅ Advanced search, filter, and sort capabilities
- ✅ Due dates and reminder notifications
- ✅ Recurring tasks (daily, weekly, monthly, custom intervals)
- ✅ Real-time task synchronization via WebSocket
- ✅ Complete audit log for all task operations
- ✅ Responsive UI with dark mode support

### Technical Features
- 🔄 Event-driven architecture with Dapr + Kafka
- 🎯 4 microservices for specialized task processing
- 📊 Structured logging with correlation IDs
- 🔒 Input sanitization and XSS prevention
- 💪 Retry logic with exponential backoff
- 🏥 Health check endpoints for Kubernetes
- 📈 Database query optimization with indexes
- 🌐 CORS configuration for secure cross-origin requests

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐
│   Next.js UI    │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐      ┌──────────────────┐
│   FastAPI       │◄────►│  Dapr Sidecar    │
│   (Backend)     │      │  (localhost:3500)│
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        │ Pub/Sub
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  Neon Postgres  │      │  Kafka/Redpanda  │
│   (Database)    │      │  (Message Broker)│
└─────────────────┘      └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │ Notification │ │  Recurring   │ │    Audit     │
         │   Service    │ │Task Service  │ │   Service    │
         └──────────────┘ └──────────────┘ └──────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   WebSocket      │
         │    Service       │
         └──────────────────┘
```

### Microservices

| Service | Purpose | Dapr Features |
|---------|---------|---------------|
| **Backend API** | Core CRUD operations, authentication | Pub/Sub (publish), State, Secrets, Service Invocation |
| **Notification Service** | Sends reminders for due tasks | Pub/Sub (subscribe to `reminders`), Bindings (cron) |
| **Recurring Task Service** | Creates next occurrence on completion | Pub/Sub (subscribe to `task-events`), Service Invocation |
| **Audit Service** | Stores complete activity history | Pub/Sub (subscribe to `task-events`) |
| **WebSocket Service** | Real-time sync across clients | Pub/Sub (subscribe to `task-updates`) |

### Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `task-events` | Backend API | Recurring Task Service, Audit Service | All task CRUD operations |
| `reminders` | Backend API | Notification Service | Scheduled reminder triggers |
| `task-updates` | Backend API, Notification Service | WebSocket Service | Real-time client sync |

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks + Context
- **Real-time:** WebSocket client with auto-reconnect

### Backend
- **Framework:** FastAPI (Python)
- **Database:** Neon Serverless PostgreSQL
- **ORM:** SQLModel
- **Authentication:** Better Auth (JWT)
- **Validation:** Pydantic

### Event-Driven Infrastructure
- **Runtime:** Dapr (Distributed Application Runtime)
- **Message Broker:** Kafka (Redpanda for local, Redpanda Cloud for production)
- **Orchestration:** Kubernetes (Minikube local, DOKS/GKE/AKS cloud)

### DevOps
- **Containerization:** Docker
- **CI/CD:** GitHub Actions
- **Package Management:** Helm

## 📋 Prerequisites

### Required
- **Node.js:** 18.x or higher
- **Python:** 3.11 or higher
- **Docker:** 20.x or higher
- **Minikube:** 1.30 or higher
- **kubectl:** 1.27 or higher
- **Dapr CLI:** 1.12 or higher
- **Helm:** 3.12 or higher

### Optional
- **Redpanda Console:** For Kafka topic inspection
- **k9s:** For easier Kubernetes cluster management

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/taskflow-phase-v.git
cd taskflow-phase-v
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
# JWT_SECRET=your-secret-key
# CORS_ORIGINS=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your configuration
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Database Setup

```bash
# Option 1: Use Neon Serverless PostgreSQL (Recommended)
# Sign up at https://neon.tech and create a database
# Copy the connection string to backend/.env

# Option 2: Local PostgreSQL with Docker
docker run -d \
  --name taskflow-postgres \
  -e POSTGRES_USER=taskflow \
  -e POSTGRES_PASSWORD=taskflow \
  -e POSTGRES_DB=taskflow \
  -p 5432:5432 \
  postgres:15-alpine
```

### 5. Run Services Locally

```bash
# Terminal 1: Backend
cd backend
uvicorn src.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Access the application at http://localhost:3000
```

## ☸️ Minikube Deployment

### 1. Start Minikube

```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Install Dapr on Minikube

```bash
# Initialize Dapr on Kubernetes
dapr init -k

# Verify Dapr installation
dapr status -k

# Expected output:
#   NAME                   NAMESPACE    HEALTHY  STATUS   REPLICAS  VERSION  AGE  CREATED
#   dapr-sidecar-injector  dapr-system  True     Running  1         1.12.0   1m   2024-01-15 10:00:00
#   dapr-sentry            dapr-system  True     Running  1         1.12.0   1m   2024-01-15 10:00:00
#   dapr-operator          dapr-system  True     Running  1         1.12.0   1m   2024-01-15 10:00:00
#   dapr-placement         dapr-system  True     Running  1         1.12.0   1m   2024-01-15 10:00:00
```

### 3. Deploy Redpanda (Local Kafka)

```bash
# Create namespace
kubectl create namespace taskflow

# Deploy Redpanda
kubectl apply -f k8s/base/redpanda.yaml -n taskflow

# Wait for Redpanda to be ready
kubectl wait --for=condition=ready pod -l app=redpanda -n taskflow --timeout=300s

# Verify Redpanda is running
kubectl get pods -n taskflow -l app=redpanda
```

### 4. Deploy Dapr Components

```bash
# Apply Dapr components (pub/sub, state store, secrets, bindings)
kubectl apply -f dapr-components/ -n taskflow

# Verify components
dapr components -k -n taskflow

# Expected output:
#   NAME              TYPE                     VERSION  SCOPES  CREATED              AGE
#   kafka-pubsub      pubsub.kafka             v1                2024-01-15 10:05:00  1m
#   statestore        state.postgresql         v1                2024-01-15 10:05:00  1m
#   reminder-cron     bindings.cron            v1                2024-01-15 10:05:00  1m
#   kubernetes-secrets secretstores.kubernetes v1                2024-01-15 10:05:00  1m
```

### 5. Create Kubernetes Secrets

```bash
# Database connection string
kubectl create secret generic db-secrets \
  --from-literal=connection-string="postgresql://user:password@host:5432/taskflow" \
  -n taskflow

# JWT secret
kubectl create secret generic jwt-secrets \
  --from-literal=secret-key="your-jwt-secret-key" \
  -n taskflow

# Kafka credentials (if using Redpanda Cloud)
kubectl create secret generic kafka-secrets \
  --from-literal=username="your-kafka-username" \
  --from-literal=password="your-kafka-password" \
  -n taskflow
```

### 6. Deploy Application Services

```bash
# Deploy using Helm
helm install taskflow ./helm/taskflow -n taskflow

# Or deploy using kubectl
kubectl apply -f k8s/base/ -n taskflow

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n taskflow --timeout=300s

# Check deployment status
kubectl get pods -n taskflow
```

### 7. Access the Application

```bash
# Get Minikube IP
minikube ip

# Port forward frontend service
kubectl port-forward svc/frontend 3000:3000 -n taskflow

# Port forward backend service
kubectl port-forward svc/backend 8000:8000 -n taskflow

# Access the application at http://localhost:3000
```

### 8. Monitor Services

```bash
# View logs for a specific service
kubectl logs -f deployment/backend -n taskflow

# View Dapr sidecar logs
kubectl logs -f deployment/backend -c daprd -n taskflow

# Check Dapr dashboard
dapr dashboard -k -n taskflow

# Access Redpanda Console (if deployed)
kubectl port-forward svc/redpanda-console 8080:8080 -n taskflow
# Open http://localhost:8080
```

## 🔧 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/taskflow

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Dapr
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50001

# Kafka/Dapr Pub/Sub
PUBSUB_NAME=kafka-pubsub
TASK_EVENTS_TOPIC=task-events
REMINDERS_TOPIC=reminders
TASK_UPDATES_TOPIC=task-updates

# State Store
STATE_STORE_NAME=statestore

# Logging
LOG_LEVEL=INFO
```

### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:8001

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## 📚 API Documentation

The API is fully documented using OpenAPI/Swagger. Access the interactive documentation at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/signup` - Create new user account
- `POST /api/signin` - Authenticate and get JWT token
- `POST /api/logout` - Invalidate session
- `GET /api/auth/me` - Get current user info

#### Tasks
- `GET /api/{user_id}/tasks` - List tasks (with filters, search, sort)
- `POST /api/{user_id}/tasks` - Create new task
- `GET /api/{user_id}/tasks/{task_id}` - Get task by ID
- `PUT /api/{user_id}/tasks/{task_id}` - Update task
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task (soft delete)
- `PATCH /api/{user_id}/tasks/{task_id}/complete` - Mark complete
- `PATCH /api/{user_id}/tasks/{task_id}/incomplete` - Mark incomplete

#### Tags
- `GET /api/{user_id}/tags` - List user's tags
- `POST /api/{user_id}/tags` - Create new tag
- `PUT /api/{user_id}/tags/{tag_id}` - Update tag
- `DELETE /api/{user_id}/tags/{tag_id}` - Delete tag

#### Audit Log
- `GET /api/{user_id}/audit` - Get audit log (paginated, filterable)

#### Health Checks
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (for Kubernetes)
- `GET /health/live` - Liveness check (for Kubernetes)

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_tasks.py

# Run with verbose output
pytest -v
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests (requires running backend)
npm run test:e2e
```

## 🐛 Troubleshooting

### Minikube Issues

**Problem:** Pods stuck in `Pending` state
```bash
# Check node resources
kubectl describe nodes

# Check pod events
kubectl describe pod <pod-name> -n taskflow

# Solution: Increase Minikube resources
minikube delete
minikube start --cpus=4 --memory=8192
```

**Problem:** Dapr sidecar not injecting
```bash
# Verify Dapr is installed
dapr status -k

# Check deployment annotations
kubectl get deployment <deployment-name> -n taskflow -o yaml | grep dapr

# Ensure annotations are present:
#   dapr.io/enabled: "true"
#   dapr.io/app-id: "backend"
#   dapr.io/app-port: "8000"
```

### Kafka/Redpanda Issues

**Problem:** Messages not being delivered
```bash
# Check Redpanda logs
kubectl logs -f deployment/redpanda -n taskflow

# Verify Dapr pub/sub component
kubectl get component kafka-pubsub -n taskflow -o yaml

# Test pub/sub manually
dapr publish --publish-app-id backend --pubsub kafka-pubsub --topic task-events --data '{"test": "message"}'
```

### Database Connection Issues

**Problem:** Backend can't connect to database
```bash
# Verify secret exists
kubectl get secret db-secrets -n taskflow

# Check connection string format
kubectl get secret db-secrets -n taskflow -o jsonpath='{.data.connection-string}' | base64 -d

# Test connection from pod
kubectl exec -it deployment/backend -n taskflow -- python -c "from src.database import init_db; import asyncio; asyncio.run(init_db())"
```

## 📊 Monitoring

### Logs

```bash
# View all logs in namespace
kubectl logs -f -l app=taskflow -n taskflow --all-containers=true

# View specific service logs
kubectl logs -f deployment/backend -n taskflow

# View Dapr sidecar logs
kubectl logs -f deployment/backend -c daprd -n taskflow

# Follow logs with stern (if installed)
stern -n taskflow .
```

### Metrics

```bash
# View resource usage
kubectl top pods -n taskflow
kubectl top nodes

# Dapr metrics (Prometheus format)
kubectl port-forward svc/dapr-dashboard 8080:8080 -n dapr-system
# Access http://localhost:8080
```

## 🚢 Production Deployment

For production deployment to cloud Kubernetes (DOKS/GKE/AKS), see:
- [Cloud Deployment Guide](./docs/cloud-deployment.md)
- [CI/CD Setup](./docs/ci-cd.md)
- [Monitoring & Alerting](./docs/monitoring.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Dapr](https://dapr.io/) - Distributed Application Runtime
- [Redpanda](https://redpanda.com/) - Kafka-compatible streaming platform
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework for production

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/taskflow-phase-v/issues
- Documentation: https://docs.taskflow.example.com
- Email: support@taskflow.example.com
