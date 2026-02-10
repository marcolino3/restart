#!/bin/bash
set -euo pipefail

# Creates Kubernetes secrets from a .env file
# Usage: ./scripts/setup-secrets.sh <namespace> <env-file>
# Example: ./scripts/setup-secrets.sh restart-staging ./restart-backend/.env

NAMESPACE="${1:?Usage: $0 <namespace> <env-file>}"
ENV_FILE="${2:?Usage: $0 <namespace> <env-file>}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: File $ENV_FILE not found"
  exit 1
fi

echo "Creating backend-secrets in namespace: $NAMESPACE"

# Build --from-literal args from .env file
ARGS=()
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  # Remove surrounding quotes from value
  value="${value%\"}"
  value="${value#\"}"
  ARGS+=("--from-literal=${key}=${value}")
done < "$ENV_FILE"

kubectl create secret generic backend-secrets \
  --namespace="$NAMESPACE" \
  "${ARGS[@]}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets created successfully in $NAMESPACE"
