#!/bin/bash
set -euo pipefail

# ⚠ DEPRECATED — Bitte nicht mehr verwenden.
#
# Dieses Skript erstellt UN-verschlüsselte K8s Secrets direkt im Cluster und
# umgeht damit den Sealed-Secrets-Workflow. Es bleibt nur als Notfall-Tool
# (z. B. Cluster-Bootstrap, bevor sealed-secrets-controller läuft) erhalten.
#
# Standard-Workflow:
#   ./scripts/bootstrap-secrets.sh staging
#   ./scripts/bootstrap-secrets.sh production
# Diese erzeugen SealedSecret-Manifeste, die committed werden können.
#
# Creates Kubernetes secrets from a .env file
# Usage: ./scripts/setup-secrets.sh <namespace> <env-file>
# Example: ./scripts/setup-secrets.sh restart-staging ./apps/backend/.env

echo "⚠ DEPRECATED: setup-secrets.sh schreibt Klartext-Secrets in den Cluster." >&2
echo "  Nutze stattdessen: ./scripts/bootstrap-secrets.sh <staging|production>" >&2
echo "  Fortfahren in 5 Sekunden — Ctrl+C zum Abbrechen…" >&2
sleep 5

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
