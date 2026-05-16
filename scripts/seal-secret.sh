#!/bin/bash
# Verschlüsselt ein einzelnes Secret-Manifest (oder eine .env-Datei) in ein
# SealedSecret, das gefahrlos ins Git committed werden kann.
#
# Voraussetzungen:
#   - kubeseal CLI installiert (brew install kubeseal)
#   - kubectl konfiguriert auf den Ziel-Cluster (kubeseal holt den Public-Key)
#
# Beispiele:
#   # Aus einer .env-Datei einen SealedSecret namens backend-secrets erzeugen:
#   ./scripts/seal-secret.sh \
#       --name backend-secrets \
#       --namespace restart-staging \
#       --from-env ./apps/backend/.env.staging \
#       --output k8s/staging/sealed-secrets/backend-secrets.yaml
#
#   # Aus einem bestehenden plain Secret-Manifest:
#   ./scripts/seal-secret.sh \
#       --from-file ./tmp-plain-secret.yaml \
#       --output k8s/production/sealed-secrets/backend-secrets.yaml

set -euo pipefail

NAME=""
NAMESPACE=""
ENV_FILE=""
PLAIN_FILE=""
OUTPUT=""

usage() {
  cat <<EOF
Usage: $0 [options]

Required (one of):
  --from-env <path>         Liest Key=Value-Paare aus einer .env-Datei
  --from-file <path>        Erwartet ein bestehendes K8s Secret-YAML

Mit --from-env zusätzlich erforderlich:
  --name <secret-name>      Name des Secrets (z. B. backend-secrets)
  --namespace <namespace>   Ziel-Namespace (z. B. restart-staging)

Immer erforderlich:
  --output <path>           Pfad für das generierte SealedSecret-YAML

Optionale Flags:
  --controller-name <name>  Default: sealed-secrets-controller
  --controller-namespace <ns> Default: kube-system
EOF
  exit 1
}

CONTROLLER_NAME="sealed-secrets-controller"
CONTROLLER_NS="kube-system"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="$2"; shift 2 ;;
    --namespace) NAMESPACE="$2"; shift 2 ;;
    --from-env) ENV_FILE="$2"; shift 2 ;;
    --from-file) PLAIN_FILE="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --controller-name) CONTROLLER_NAME="$2"; shift 2 ;;
    --controller-namespace) CONTROLLER_NS="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unbekanntes Flag: $1"; usage ;;
  esac
done

if ! command -v kubeseal >/dev/null 2>&1; then
  echo "FEHLER: kubeseal nicht gefunden. Installation: brew install kubeseal" >&2
  exit 1
fi

if [[ -z "$OUTPUT" ]]; then
  echo "FEHLER: --output ist erforderlich" >&2; usage
fi

if [[ -n "$ENV_FILE" && -n "$PLAIN_FILE" ]]; then
  echo "FEHLER: --from-env UND --from-file gleichzeitig — nur eines wählen" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"

if [[ -n "$ENV_FILE" ]]; then
  if [[ -z "$NAME" || -z "$NAMESPACE" ]]; then
    echo "FEHLER: --name und --namespace sind mit --from-env erforderlich" >&2
    exit 1
  fi
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "FEHLER: .env-Datei nicht gefunden: $ENV_FILE" >&2
    exit 1
  fi

  # Klartext-Secret generieren, durch kubeseal pipen, NIE auf Disk schreiben.
  ARGS=()
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    ARGS+=("--from-literal=${key}=${value}")
  done < "$ENV_FILE"

  kubectl create secret generic "$NAME" \
    --namespace="$NAMESPACE" \
    "${ARGS[@]}" \
    --dry-run=client -o yaml \
    | kubeseal \
        --controller-name "$CONTROLLER_NAME" \
        --controller-namespace "$CONTROLLER_NS" \
        --format yaml \
        > "$OUTPUT"

  echo "✓ SealedSecret geschrieben: $OUTPUT"
  echo "  Name:      $NAME"
  echo "  Namespace: $NAMESPACE"
  echo "  Quelle:    $ENV_FILE (Klartext wurde NICHT zwischengespeichert)"
  exit 0
fi

if [[ -n "$PLAIN_FILE" ]]; then
  if [[ ! -f "$PLAIN_FILE" ]]; then
    echo "FEHLER: Secret-Datei nicht gefunden: $PLAIN_FILE" >&2
    exit 1
  fi
  kubeseal \
    --controller-name "$CONTROLLER_NAME" \
    --controller-namespace "$CONTROLLER_NS" \
    --format yaml \
    < "$PLAIN_FILE" \
    > "$OUTPUT"
  echo "✓ SealedSecret geschrieben: $OUTPUT"
  exit 0
fi

echo "FEHLER: --from-env oder --from-file angeben" >&2
usage
