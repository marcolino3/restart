# Deployment Guide - Restart SaaS

## Architecture

- **Backend**: NestJS GraphQL API on port 3001
- **Frontend**: Next.js SSR on port 3000
- **Database**: PostgreSQL (Infomaniak Managed)
- **Hosting**: Infomaniak Managed Kubernetes (Switzerland)
- **CI/CD**: GitHub Actions → GitHub Container Registry → Kubernetes

## Environments

| Environment | Domain | Namespace | Trigger |
|---|---|---|---|
| Staging | staging.colibri-app.ch | restart-staging | Push to `main` |
| Production | app.colibri-app.ch | restart-production | Manual (GitHub Actions) |

## Prerequisites

- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed
- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [Docker](https://docs.docker.com/get-docker/) installed
- Infomaniak account with API token
- GitHub repository with Actions enabled

## Initial Setup

### 1. Provision Infrastructure with Terraform

```bash
cd terraform

# Set Infomaniak API token
export INFOMANIAK_API_TOKEN="your-token"

# Initialize Terraform
terraform init

# Plan and apply for staging
terraform plan -var-file=environments/staging.tfvars -var="db_password=YOUR_SECURE_PASSWORD"
terraform apply -var-file=environments/staging.tfvars -var="db_password=YOUR_SECURE_PASSWORD"
```

### 2. Configure kubectl

Download the kubeconfig from Infomaniak dashboard and set it up:

```bash
export KUBECONFIG=~/.kube/infomaniak-config
```

### 3. Deploy Kubernetes Manifests

```bash
# Apply staging manifests
kubectl apply -k k8s/staging/

# Apply production manifests
kubectl apply -k k8s/production/
```

### 4. Create Secrets

Create a `.env.staging` file with production values, then:

```bash
./scripts/setup-secrets.sh restart-staging .env.staging
./scripts/setup-secrets.sh restart-production .env.production
```

### 5. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets → Actions, and add:

| Secret | Description |
|---|---|
| `KUBE_CONFIG` | Base64-encoded kubeconfig: `cat ~/.kube/config \| base64` |
| `DB_PASSWORD_STAGING` | Staging database password |
| `DB_PASSWORD_PRODUCTION` | Production database password |
| `JWT_ACCESS_TOKEN_SECRET` | JWT access token signing secret |
| `JWT_REFRESH_TOKEN_SECRET` | JWT refresh token signing secret |
| `GOOGLE_AUTH_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_AUTH_CLIENT_SECRET` | Google OAuth client secret |
| `ORG_SETTINGS_ENCRYPTION_KEY` | Organization settings encryption key |
| `SUPERADMIN_EMAIL` | Super admin email |
| `SUPERADMIN_PASSWORD` | Super admin password |

### 6. DNS Configuration

Point your domains to the Kubernetes Load Balancer IP:

```
staging.colibri-app.ch  → A record → <Load Balancer IP>
app.colibri-app.ch      → A record → <Load Balancer IP>
```

Get the Load Balancer IP:

```bash
kubectl get svc -n ingress-nginx
```

## Deployment Workflow

### Automatic (Staging)

1. Push code to `main` branch
2. GitHub Actions runs CI (lint, test, build)
3. Docker images are built and pushed to ghcr.io
4. Images are deployed to staging automatically

### Manual (Production)

1. Go to GitHub → Actions → "Deploy Production"
2. Click "Run workflow"
3. Enter the image tag (or leave as "latest")
4. Wait for deployment and smoke test

### Local Deployment

```bash
# Deploy to staging
./scripts/deploy-staging.sh <image-tag>

# Deploy to production (with confirmation prompt)
./scripts/deploy-production.sh <image-tag>
```

## Rollback

```bash
# Rollback staging
./scripts/rollback.sh staging

# Rollback production
./scripts/rollback.sh production
```

## Local Development with Docker

```bash
# Start all services locally
docker compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# GraphQL:  http://localhost:3001/api/graphql
```

## Health Checks

- **Liveness**: `GET /api/health` — returns 200 if the service is running
- **Readiness**: `GET /api/health/ready` — returns 200 if the database connection is healthy

## Troubleshooting

### Check pod status

```bash
kubectl get pods -n restart-staging
kubectl get pods -n restart-production
```

### View pod logs

```bash
kubectl logs -f deployment/backend -n restart-staging
kubectl logs -f deployment/frontend -n restart-staging
```

### Check ingress

```bash
kubectl get ingress -n restart-staging
kubectl describe ingress restart-ingress -n restart-staging
```

### Check TLS certificates

```bash
kubectl get certificates -n restart-staging
kubectl describe certificate staging-tls -n restart-staging
```

### Force restart a deployment

```bash
kubectl rollout restart deployment/backend -n restart-staging
```
