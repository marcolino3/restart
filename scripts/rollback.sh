#!/bin/bash
set -euo pipefail

# Rollback to previous deployment version
# Usage: ./scripts/rollback.sh <environment>
# Example: ./scripts/rollback.sh staging

ENV="${1:?Usage: $0 <staging|production>}"

case "$ENV" in
  staging)
    NAMESPACE="restart-staging"
    ;;
  production)
    NAMESPACE="restart-production"
    ;;
  *)
    echo "Error: Environment must be 'staging' or 'production'"
    exit 1
    ;;
esac

echo "Rolling back deployments in $NAMESPACE..."

kubectl rollout undo deployment/backend -n "$NAMESPACE"
kubectl rollout undo deployment/frontend -n "$NAMESPACE"

echo "Waiting for backend rollback..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s

echo "Waiting for frontend rollback..."
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s

echo "Rollback complete in $NAMESPACE!"
