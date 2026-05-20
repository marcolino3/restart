# Terraform Next Steps — Migration auf Provider v1.4

Die Migration ist abgeschlossen. Folgende Punkte sind noch von Hand zu erledigen:

## 1. Numerische Projekt-ID finden

Der Infomaniak Terraform-Provider braucht die **numerische** Projekt-ID,
nicht den `PCP-XXXXXXXX`-Code aus dem Manager-UI.

**Variante A — Aus der Manager-URL ablesen:**

1. Manager öffnen → Public Cloud → Projekt `restart-staging` anklicken
2. URL anschauen, z. B.:
   `https://manager.infomaniak.com/v3/ng/products/cloud/public-cloud/20126/projects/<NUMBER>/...`
3. `<NUMBER>` (rein numerisch) ist die `project_id`

**Variante B — Via API:**

```bash
curl -s -H "Authorization: Bearer $INFOMANIAK_TOKEN" \
  "https://api.infomaniak.com/api/v1/products/public_cloud/20126/project" \
  | jq '.data[] | {id, name, openstack_id}'
```

Der `id`-Wert ist deine `project_id`. Der `openstack_id` ist das `PCP-NB77OND`.

## 2. tfvars befüllen

```bash
# terraform/environments/staging.tfvars
infomaniak = {
  cloud_id   = 20126
  project_id = <NUMBER aus Schritt 1>
}
```

## 3. Terraform initialisieren & planen

```bash
cd terraform
terraform init

# Plan anschauen — KEIN Apply!
terraform plan -var-file=environments/staging.tfvars
```

Falls Errors:
- `pack_name` (Cluster oder DB) → siehe Infomaniak-Manager für gültige Werte
- `pool_flavor` → siehe verfügbare Flavors im Manager (Compute → Flavors)
- `region` → muss zur Availability-Zone passen (`dc4-a` ↔ `az-1`/`az-2`/`az-3`)

## 4. Apply

```bash
terraform apply -var-file=environments/staging.tfvars
```

Dauert ca. 10–15 Min. Provisioniert:
- KaaS-Cluster `restart-staging`
- Instance-Pool (2 Worker-Nodes)
- Managed PostgreSQL 16 `restart-staging`
- Namespace `restart-staging`
- cert-manager + nginx-ingress + sealed-secrets via Helm
- Let's Encrypt ClusterIssuer

## 5. Outputs abgreifen

```bash
# Kubeconfig in lokale Datei extrahieren
terraform output -raw kubeconfig > ~/.kube/colibri-staging.yaml
export KUBECONFIG=~/.kube/colibri-staging.yaml
kubectl get nodes

# DB-Connection-String für SealedSecret
terraform output -raw database_url
```

## 6. Allowed CIDRs für DB nachziehen

Nach Apply den Cluster-Egress-CIDR herausfinden:

```bash
kubectl get nodes -o wide
```

External-IP-Range in `staging.tfvars` ergänzen:

```hcl
db_allowed_cidrs = ["X.Y.Z.0/24", "DEINE_HOME_IP/32"]
```

Dann `terraform apply` erneut laufen lassen.

## 7. Load Balancer IP für DNS holen

Sobald nginx-ingress läuft:

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

`EXTERNAL-IP` ist die Floating-IP für deine A-Records
(`staging.colibri-app.ch`, `app.colibri-app.ch`).
