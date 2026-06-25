# Deployment Guide - Restart SaaS

## Architecture

- **Backend**: NestJS GraphQL API (`apps/backend/`) on port 3001
- **Frontend**: Next.js SSR (`apps/web/`) on port 3000
- **Database**: PostgreSQL (Infomaniak Managed)
- **Hosting**: Infomaniak Managed Kubernetes (Switzerland)
- **CI/CD**: GitHub Actions → GitHub Container Registry → Kubernetes

## Project Structure

```
restart/
├── apps/
│   ├── backend/        # NestJS GraphQL API
│   └── web/            # Next.js Frontend
├── k8s/                # Kubernetes manifests (Kustomize)
├── terraform/          # Infomaniak infrastructure
├── scripts/            # Deployment helper scripts
├── .github/workflows/  # CI/CD pipelines
└── docker-compose.yml  # Local development
```

## Environments

| Environment | Domain | Namespace | Trigger |
|---|---|---|---|
| Staging | staging.colibri-app.ch | restart-staging | Push to `main` |
| Production | app.colibri-app.ch | restart-production | Manual (GitHub Actions) |

### Architektur-Entscheidung: getrennte Cloud-Projekte für Staging und Production

**Entscheidung (2026-06-25):** Staging und Production laufen in **zwei getrennten
Infomaniak Public-Cloud-Projekten** mit je **eigenem KaaS-Cluster und eigener
Postgres-VM** — nicht in einem geteilten Projekt/Cluster mit zwei Namespaces.

**Warum (stärkste Isolations-Stufe, bewusst gewählt):**
- **Datenschutz / Blast-Radius:** Es werden perspektivisch echte Personen-/
  Kinderdaten verarbeitet (DSGVO, hohe Sensibilität). Ein kompromittiertes oder
  fehlkonfiguriertes Staging kann technisch **nicht** an Prod-Daten — getrennte
  Projekte teilen weder Netzwerk noch etcd noch Nodes.
- **Least Privilege:** Eigene API-Tokens, kubeconfigs und Secrets pro Projekt →
  Staging-Zugriff impliziert keinen Prod-Zugriff.
- **Kein Cross-Env-Versehen:** Staging-Workloads können die Prod-DB nicht
  erreichen (getrennte Projekte/Netze).
- **Billing / Quota:** Prod-Kosten und -Quota sind sauber getrennt; ein
  Staging-Lasttest kann das Prod-Quota nicht aufbrauchen.

Beide Projekte liegen bei Infomaniak in der Schweiz (DSGVO / kein US-Cloud-Act).

**Promotion-Modell (unabhängig von der Isolation):** „Build once, promote the
same artifact" — das Image wird einmal beim Staging-Deploy gebaut; Production
baut nicht neu, sondern promotet exakt den auf Staging getesteten SHA
(`:staging-current`) mit Approval-Gate, Smoke-Test und Auto-Rollback.

**Konsequenz:** `terraform/environments/production.tfvars` trägt die `cloud_id`/
`project_id` des **separaten** Prod-Projekts; Prod wird in einem eigenen
Terraform-Workspace provisioniert (siehe „Initial Setup → 1." und Runbook B0).

**Noch offen für echten Prod-Betrieb:** automatisierte Prod-DB-Backups inkl.
Restore-Drill (vor den ersten Echtdaten) und Monitoring/Alerting (CH-Self-Host,
z. B. GlitchTip + Uptime-Kuma) — Monitoring ist aktuell deaktiviert.

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

# Infomaniak API-Token (der Provider liest var.infomaniak_token):
export TF_VAR_infomaniak_token="your-token"

# Initialize Terraform
terraform init

# Plan and apply for staging (default workspace)
# Terraform provisioniert NUR Cluster + Node-Pool + Namespace + Addons
# (cert-manager, ingress-nginx, sealed-secrets) — KEINE Datenbank.
# Die Postgres läuft als separate VM/Instanz (siehe Runbook B1).
terraform plan  -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

> ⚠️ **Production läuft in einem EIGENEN Terraform-Workspace.**
> Der State ist lokal (default-Workspace = **Staging**). Ein Prod-`apply` im
> default-Workspace würde Terraform den **Staging-State umschreiben lassen und
> Staging zerstören/umbauen**. Production daher immer in einem getrennten
> Workspace provisionieren (eigener State unter `terraform.tfstate.d/production/`):

```bash
# Prod-Cluster: EIGENER Workspace (einmalig anlegen, danach nur noch `select`)
terraform workspace new production         # später: terraform workspace select production
terraform workspace list                   # prüfen: * production

# numerische cloud_id/project_id des Prod-Projekts müssen in
# environments/production.tfvars stehen (sonst schlägt der Apply fehl)
terraform plan  -var-file=environments/production.tfvars
terraform apply -var-file=environments/production.tfvars

# WICHTIG: danach zurück auf Staging wechseln, damit kein versehentlicher
# Staging-Befehl im Prod-Workspace landet:
terraform workspace select default
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

## Production Launch Runbook (einmalig)

> Schema-Verwaltung ist auf **Migrationen-only** umgestellt. `synchronize` ist in
> staging/production per `app.module`-Guard hart gesperrt; `DB_SYNCHRONIZE=true`
> bricht dort den Boot ab. Das Kern-Schema entsteht ausschliesslich aus der
> `InitialSchema`-Baseline + inkrementellen Migrationen, die better-auth-Tabellen
> aus `CreateBetterAuthTables` (`apps/backend/src/migrations/`).

### A. Staging-Cutover (zusammen mit dem Merge dieses PRs)

Die bestehende Staging-DB hat ihr Schema via `synchronize` bekommen und die alten
(jetzt gesquashten) Migrationen als applied registriert. Nach dem Umstieg ist die
neue `InitialSchema` „pending" und würde gegen das bestehende Schema laufen
(`relation already exists`). Da Staging nur Testdaten hält: **DB einmalig leeren,
unmittelbar bevor der Merge-getriggerte Staging-Deploy läuft.**

```bash
# 1) DB leeren (nur Testdaten!) — Reihenfolge: erst leeren, DANN PR mergen,
#    damit der auto-getriggerte migrate-Job gegen die leere DB baseline-t.
#    Hinweis: Staging-Postgres läuft auf einer EXTERNEN VM (nicht in-cluster),
#    daher kein `kubectl exec deploy/postgres`. Wir starten einen kurzlebigen
#    psql-Pod, der die DB-Verbindung aus demselben Secret (`backend-secrets`)
#    zieht wie der migrate-Job — funktioniert unabhängig davon, wo die DB liegt.
kubectl run pg-wipe -n restart-staging --rm -i --restart=Never \
  --image=postgres:16-alpine \
  --overrides='{"spec":{"containers":[{"name":"pg-wipe","image":"postgres:16-alpine","command":["sh","-c","PGPASSWORD=\"$DB_PASSWORD\" psql -h \"$DB_HOST\" -p \"${DB_PORT:-5432}\" -U \"$DB_USERNAME\" -d \"$DB_NAME\" -v ON_ERROR_STOP=1 -c \"DROP SCHEMA public CASCADE; CREATE SCHEMA public;\""],"envFrom":[{"secretRef":{"name":"backend-secrets"}}]}]}}'

# 2) PR mergen → deploy-staging.yml läuft: CI-Gate → build → migrate (baseline
#    + better-auth + Admissions: card/board, rejection-reasons, rejectedBy,
#    email-templates, email-permission-enum) → deploy → smoke.
# 3) Verifizieren:
kubectl logs -n restart-staging job/migrate-<sha12>          # alle 7 Migrationen "executed"
#    (InitialSchema, CreateBetterAuthTables, AdmissionCardAndBoardSettings,
#     CreateEmailTemplatesAndAdmissionEmails, AdmissionRejectionReasons,
#     AdmissionRejectedBy, AddAdmissionEmailPermissions)
curl -s -o /dev/null -w '%{http_code}\n' https://staging.colibri-app.ch/api/health   # 200
# 4) Login + Org-Switch manuell durchklicken.
```

> Falls ein Wipe unerwünscht ist: stattdessen die Baseline auf der bestehenden DB
> als applied markieren (kein realer Run):
> `INSERT INTO typeorm_migrations (timestamp, name) VALUES (1777000000000,'InitialSchema1777000000000'),(1777000000001,'CreateBetterAuthTables1777000000001');`
> — der Wipe ist aber sauberer und verifiziert den Migration-only-Pfad direkt.

### B. Production-Voraussetzungen (vor dem ersten Prod-Deploy)

**B0 — Prod-Cluster via Terraform provisionieren (EIGENER Workspace).**
Der dedizierte Prod-Cluster (`environments/production.tfvars`, `pack=dedicated`)
wird in einem **separaten Terraform-Workspace** angelegt — siehe Warnhinweis in
„Initial Setup → 1. Provision Infrastructure". Zwingend **vor** B1–B4:

```bash
cd terraform
export TF_VAR_infomaniak_token="<prod-tauglicher-token>"
# 1) cloud_id + project_id des Prod-Projekts stehen in production.tfvars.
# 2) Provisionieren im eigenen Workspace (zerstört NICHT den Staging-State).
#    Terraform legt NUR Cluster + Node-Pool + Namespace + Addons an — KEINE DB.
terraform workspace new production
terraform plan  -var-file=environments/production.tfvars   # Plan prüfen!
terraform apply -var-file=environments/production.tfvars
# 3) kubeconfig des neuen Clusters aus dem Infomaniak Manager ziehen → für B2/B4.
terraform workspace select default   # zurück auf Staging
```

**B1 — Prod-Postgres provisionieren (CH, getrennt von Staging).**
Eigene DB/VM, Postgres ≥ 13 (wegen `gen_random_uuid()`/`uuid-ossp`). Als Superuser
einmalig die Extension anlegen, damit der migrate-Job kein CREATE-Recht braucht:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Host/Port/User/Passwort/DB-Name notieren → fliessen in B3 + die Prod-ConfigMap.

**B2 — Prod-Namespace + Cluster-Prereqs.**

```bash
kubectl create namespace restart-production
# GHCR-imagePull-Secret (Token mit read:packages):
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io --docker-username=<gh-user> \
  --docker-password=<gh-pat> -n restart-production
# sealed-secrets-Controller muss clusterweit laufen (kube-system) — bei
# Shared-Cluster mit Staging bereits vorhanden.
```

**B3 — Prod-SealedSecrets erzeugen + verdrahten.**

```bash
# Sealing-Keys VORHER sichern (sonst sind verschlüsselte Secrets unrettbar):
AGE_RECIPIENT=<dein-age-pubkey> ./scripts/backup-sealing-keys.sh ~/secure-backup/
# .env.production (BETTER_AUTH_SECRET, DB-Creds aus B1, OAuth, Mailer, …) anlegen,
# dann versiegeln:
./scripts/bootstrap-secrets.sh production
```

Danach in `k8s/production/kustomization.yaml`:
- die `sealed-secrets/{backend,frontend}-secrets.yaml`-Resources einkommentieren,
- `DB_HOST=PRODUCTION_DB_HOST_PLACEHOLDER` durch den echten Host aus B1 ersetzen,
- committen, und einmalig `kubectl apply -k k8s/production/` (legt Deployments,
  Services, Ingress, NetworkPolicies, Secrets an).

**B4 — GitHub `production`-Environment.**
Settings → Environments → `production`: Required Reviewers (Approval-Gate) setzen,
`KUBE_CONFIG`-Secret prüfen (`cat ~/.kube/config | base64`). `deploy-production.yml`
nutzt `environment: production` bereits.

### C. Erster Production-Deploy

GitHub → Actions → **Deploy Production** → *Run workflow*. `image_tag` leer lassen
→ promotet automatisch den aktuell auf Staging laufenden SHA (`:staging-current`).
Ablauf: resolve/validate → migrate (frische Prod-DB → Baseline + better-auth) →
deploy → smoke (`app.colibri-app.ch/api/health`) → Rollback-on-fail →
`:production-current`-Tag → GitHub-Deployment-Record (Audit, im Deployments-Tab).

```bash
# Nach erfolgreichem Run prüfen:
kubectl get pods -n restart-production
curl -s -o /dev/null -w '%{http_code}\n' https://app.colibri-app.ch/api/health   # 200
# Login + Org-Switch manuell verifizieren.
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
# Frontend: http://localhost:4000
# Backend:  http://localhost:4001
# GraphQL:  http://localhost:4001/graphql
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
