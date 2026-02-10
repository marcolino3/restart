#!/bin/bash
set -euo pipefail

# Deploy to staging from local machine
# Usage: ./scripts/deploy-staging.sh [image-tag]

TAG="${1:-latest}"
NAMESPACE="restart-staging"

echo "Deploying to staging with tag: $TAG"

# Apply Kustomize manifests
kubectl apply -k k8s/staging/

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

echo "Staging deployment complete!"
