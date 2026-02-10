#!/bin/bash
set -euo pipefail

# Deploy to production from local machine
# Usage: ./scripts/deploy-production.sh [image-tag]

TAG="${1:-latest}"
NAMESPACE="restart-production"

echo "=== PRODUCTION DEPLOYMENT ==="
echo "Tag: $TAG"
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled."
  exit 0
fi

# Apply Kustomize manifests
kubectl apply -k k8s/production/

# Update image tags
kubectl set image deployment/backend \
  backend="ghcr.io/${GITHUB_REPOSITORY_OWNER:-OWNER}/restart-backend:${TAG}" \
  -n "$NAMESPACE"
kubectl set image deployment/frontend \
  frontend="ghcr.io/${GITHUB_REPOSITORY_OWNER:-OWNER}/restart-frontend:${TAG}" \
  -n "$NAMESPACE"

# Wait for rollout
echo "Waiting for backend rollout..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s

echo "Waiting for frontend rollout..."
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s

# Smoke test
echo "Running smoke test..."
sleep 10
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.colibri-app.ch/api/health)
if [ "$STATUS" != "200" ]; then
  echo "WARNING: Smoke test failed! HTTP status: $STATUS"
  echo "Consider rolling back with: ./scripts/rollback.sh production"
  exit 1
fi

echo "Production deployment complete! Smoke test passed."
