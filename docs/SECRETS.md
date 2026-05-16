# Secrets-Management mit Sealed Secrets

Restart/Colibri nutzt **Bitnami Sealed Secrets**, um Kubernetes Secrets
verschlüsselt im Git aufzubewahren. Nur der `sealed-secrets-controller`
im Cluster kann sie entschlüsseln.

---

## Warum Sealed Secrets?

| Ansatz | Vor | Contra |
|---|---|---|
| Klartext in K8s, nicht im Git | Einfach | Kein Audit-Trail, manuelle Synchronisation, Drift |
| Klartext in K8s + Git (`secrets.yaml`) | Versioniert | Wer Git-Zugriff hat, sieht alle Production-Geheimnisse |
| External Secrets Operator (Vault) | Industrie-Standard | Eigener Vault-Cluster nötig, Operations-Overhead |
| **Sealed Secrets** | Verschlüsselt im Git, kein externer Vault, GitOps-tauglich | Schlüssel-Backup ist kritisch |

Für eine 1-Person-Schule reicht Sealed Secrets. Migration zu External Secrets
Operator / Vault ist später möglich.

---

## Initial-Setup (einmalig pro Cluster)

### 1. Controller installieren

Terraform installiert den Controller automatisch beim nächsten `apply`:

```bash
cd terraform
terraform apply
```

Prüfen:

```bash
kubectl get pods -n kube-system -l name=sealed-secrets-controller
```

### 2. `kubeseal` CLI installieren

```bash
brew install kubeseal
```

### 3. (Empfohlen) Sealing-Keys sichern

```bash
# Optional: age für Verschlüsselung
brew install age
age-keygen -o ~/.age/colibri-backup.key   # Public-Key zeigen: grep public ~/.age/colibri-backup.key
AGE_RECIPIENT=age1...               # Public-Key einsetzen
./scripts/backup-sealing-keys.sh ~/secure-backup/
```

Den `*.age`-Dump in einem **separaten** Storage offline aufbewahren
(1Password Business Vault, Bitwarden, USB-Stick im Tresor).

**Cadence:** monatlich + nach Cluster-Recreate.

---

## Workflow: Secret hinzufügen / aktualisieren

### Variante A: alle Secrets einer Umgebung neu erzeugen

Lokal eine `.env.staging` bzw. `.env.production` in `apps/backend/`
(und optional `apps/web/`) anlegen. Diese Dateien sind via `.gitignore`
geschützt.

```bash
# kubectl muss auf den Ziel-Cluster zeigen
kubectl config use-context infomaniak-staging
./scripts/bootstrap-secrets.sh staging
```

Output: `k8s/staging/sealed-secrets/backend-secrets.yaml` (verschlüsselt,
committable).

Danach in `k8s/staging/kustomization.yaml` die SealedSecrets-Datei unter
`resources` referenzieren (siehe Kommentar dort).

### Variante B: einzelnes Secret aktualisieren

```bash
./scripts/seal-secret.sh \
    --name backend-secrets \
    --namespace restart-production \
    --from-env ./apps/backend/.env.production \
    --output k8s/production/sealed-secrets/backend-secrets.yaml
```

### Variante C: einzelnes Feld in einem Secret ändern

`kubeseal` unterstützt Merge-Mode — neuer Key wird zu bestehendem SealedSecret
hinzugefügt, ohne dass die anderen Keys neu verschlüsselt werden müssen:

```bash
echo -n "neuer-wert" | kubeseal \
    --controller-name sealed-secrets-controller \
    --controller-namespace kube-system \
    --raw \
    --namespace restart-production \
    --name backend-secrets \
    --from-file=/dev/stdin
# Die Ausgabe ist nur der verschlüsselte Wert — in die bestehende
# encryptedData-Map im YAML-File einfügen.
```

---

## Rotation

### Sealing-Keys

Der Controller rotiert seine eigenen Keys automatisch alle 30 Tage (siehe
`terraform/sealed-secrets.tf`, `keyrenewperiod: 720h`). Alte Keys bleiben
aktiv, damit bestehende SealedSecrets weiter funktionieren — nur neue
Verschlüsselungen nutzen den frischen Key.

**Nach jeder Rotation:** `./scripts/backup-sealing-keys.sh` erneut laufen
lassen, sonst hast du im Backup nicht den aktuellen Schlüssel.

### Applikations-Secrets

Diese rotieren wir **manuell**:

| Secret | Frequenz | Auslöser |
|---|---|---|
| `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET` | alle 90 Tage | Kalender-Reminder |
| `ORG_SETTINGS_ENCRYPTION_KEY` | nur bei Verdacht auf Kompromittierung | Manuell |
| DB-Passwörter | alle 180 Tage | Kalender-Reminder |
| OAuth-Credentials (Google, Apple) | jährlich | Erinnerung von Google/Apple |

Rotation-Workflow:
1. Neuen Wert in der entsprechenden `.env.<env>` aktualisieren
2. `./scripts/seal-secret.sh` neu ausführen
3. Commit + Deploy
4. App startet mit neuem Secret durch — bei JWT-Wechsel sind alle aktiven
   Sessions invalid (User müssen neu einloggen)

---

## Disaster Recovery

### Szenario: Cluster zerstört, Sealing-Keys verloren

1. Backup-Datei `sealed-secrets-keys-*.yaml.age` entschlüsseln:
   ```bash
   age -d -i ~/.age/colibri-backup.key ./sealed-secrets-keys-2026-05-16.yaml.age > restored-keys.yaml
   ```
2. Neuen Cluster bereitstellen (`terraform apply`)
3. Keys vor dem Controller-Start einspielen:
   ```bash
   kubectl apply -f restored-keys.yaml -n kube-system
   kubectl delete pod -n kube-system -l name=sealed-secrets-controller
   ```
4. Bestehende SealedSecrets aus dem Git werden vom Controller wieder
   entschlüsselt.

### Szenario: Backup ebenfalls verloren

Alle Secrets neu generieren (DB-Passwörter, JWT-Secrets, OAuth) und
mit `./scripts/bootstrap-secrets.sh` neu verschlüsseln.
**Konsequenz:** alle aktiven Sessions invalide, OAuth-Apps müssen neu
provisioniert werden, eventuell verschlüsselte Daten in der DB (über
`ORG_SETTINGS_ENCRYPTION_KEY`) sind unwiederbringlich verloren.

→ Deshalb: **Sealing-Key-Backup IST das wichtigste Backup**.

---

## Was NICHT in dieses Verzeichnis gehört

`.gitignore` blockiert das automatisch:
- `*.secret.yaml`, `secrets-plain.yaml` — Klartext-Manifeste
- `.env`, `.env.*` (außer `.env.example`) — Klartext-ENV
- `sealed-secrets-backup/`, `sealed-secrets-keys-*` — Master-Key-Dumps

Vor jedem Commit prüfen:
```bash
git diff --cached | grep -iE "(password|secret|api[_-]?key|token).*=" || echo "✓ keine offensichtlichen Klartexte"
```

Längerfristig: `gitleaks` als pre-commit-Hook (siehe Roadmap-Punkt
"Security-Tooling").
