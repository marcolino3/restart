#!/bin/bash
# Bootstrap: alle Secrets für eine Umgebung aus lokalen .env-Dateien in
# SealedSecret-Manifests verschlüsseln. Einmalig pro Env zu nutzen oder
# wenn sich mehrere Secret-Werte gleichzeitig ändern.
#
# Voraussetzung: kubectl ist auf den jeweiligen Cluster konfiguriert,
# sealed-secrets-controller läuft (siehe terraform/sealed-secrets.tf).
#
# Beispiel:
#   ./scripts/bootstrap-secrets.sh staging
#   ./scripts/bootstrap-secrets.sh production

set -euo pipefail

ENV="${1:-}"
if [[ -z "$ENV" || ( "$ENV" != "staging" && "$ENV" != "production" ) ]]; then
  echo "Usage: $0 <staging|production>"
  exit 1
fi

NAMESPACE="restart-$ENV"
SECRETS_DIR="k8s/$ENV/sealed-secrets"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_ENV="apps/backend/.env.$ENV"
FRONTEND_ENV="apps/web/.env.$ENV"

if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "FEHLER: $BACKEND_ENV nicht gefunden."
  echo "Lege die Datei aus deiner lokalen .env an und fülle die Production-Werte ein."
  echo "WICHTIG: $BACKEND_ENV NIEMALS committen (.gitignore prüfen)."
  exit 1
fi

mkdir -p "$SECRETS_DIR"

echo "→ Verschlüssele backend-secrets aus $BACKEND_ENV"
"$SCRIPT_DIR/seal-secret.sh" \
  --name backend-secrets \
  --namespace "$NAMESPACE" \
  --from-env "$BACKEND_ENV" \
  --output "$SECRETS_DIR/backend-secrets.yaml"

if [[ -f "$FRONTEND_ENV" ]]; then
  echo "→ Verschlüssele frontend-secrets aus $FRONTEND_ENV"
  "$SCRIPT_DIR/seal-secret.sh" \
    --name frontend-secrets \
    --namespace "$NAMESPACE" \
    --from-env "$FRONTEND_ENV" \
    --output "$SECRETS_DIR/frontend-secrets.yaml"
else
  echo "ℹ $FRONTEND_ENV nicht vorhanden — frontend-secrets wird übersprungen."
fi

echo ""
echo "Fertig. Nächste Schritte:"
echo "  1. Generierte SealedSecrets prüfen: $SECRETS_DIR/*.yaml"
echo "  2. Sicherstellen, dass $SECRETS_DIR/ in der kustomization.yaml referenziert ist"
echo "  3. Commit + Push — der Controller im Cluster entschlüsselt sie automatisch"
