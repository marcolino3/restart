#!/bin/bash
# Backup des Sealed-Secrets Master-Keys.
#
# ⚠ KRITISCH: Wenn dieser Schlüssel verloren geht UND der Cluster zerstört
# wird, sind ALLE eingecheckten SealedSecrets unwiederbringlich verloren.
# Du müsstest dann alle Production-Secrets neu generieren (DB-Passwort,
# JWT-Secrets, OAuth-Credentials, …) und mit `kubeseal` neu verschlüsseln.
#
# Empfohlene Frequenz: monatlich + nach jeder Key-Rotation (alle 30 Tage).
# Ablage: verschlüsselt (age/gpg) in einem separaten Storage außerhalb
# des Clusters und außerhalb von GitHub (z. B. 1Password Business Vault,
# Bitwarden, lokaler Truecrypt-Container offline).

set -euo pipefail

OUT_DIR="${1:-./sealed-secrets-backup}"
mkdir -p "$OUT_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DUMP_FILE="$OUT_DIR/sealed-secrets-keys-${TIMESTAMP}.yaml"

echo "→ Dumping Sealed-Secrets Master-Keys → $DUMP_FILE"
kubectl get secret -n kube-system \
  -l sealedsecrets.bitnami.com/sealed-secrets-key=active \
  -o yaml > "$DUMP_FILE"

# Sofort Berechtigungen einschränken — keine Lesen für andere.
chmod 600 "$DUMP_FILE"

if command -v age >/dev/null 2>&1; then
  if [[ -n "${AGE_RECIPIENT:-}" ]]; then
    echo "→ Verschlüssele Dump mit age für Empfänger: $AGE_RECIPIENT"
    age -r "$AGE_RECIPIENT" -o "${DUMP_FILE}.age" "$DUMP_FILE"
    rm "$DUMP_FILE"
    echo "✓ Verschlüsseltes Backup: ${DUMP_FILE}.age"
    echo "  → Diese Datei offline aufbewahren (Password-Manager, USB-Stick im Tresor)."
  else
    echo "⚠ Kein AGE_RECIPIENT gesetzt. Klartext-Dump liegt unter $DUMP_FILE"
    echo "  → SOFORT mit age / gpg verschlüsseln und das Original löschen."
  fi
else
  echo "⚠ age nicht installiert (brew install age)."
  echo "  → Klartext-Dump unter $DUMP_FILE SOFORT manuell verschlüsseln."
fi

echo ""
echo "Cluster-Restore: kubectl apply -f <dump> --namespace kube-system"
echo "  Danach: kubectl delete pod -n kube-system -l name=sealed-secrets-controller"
echo "  → der Controller lädt die wiederhergestellten Keys beim Restart."
