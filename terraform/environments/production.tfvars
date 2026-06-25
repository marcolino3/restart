environment        = "production"
cluster_name       = "restart-production"
cluster_region     = "dc4-a"
cluster_pack       = "dedicated" # SLA 99.9%, dedizierter etcd
kubernetes_version = "1.33"

pool_flavor = "a4-ram8-disk20-perf1"
pool_az     = "az-2"
pool_min    = 2
pool_max    = 4 # Autoscaling

letsencrypt_email = "marco@marranchelli.com"

# Production läuft idealerweise in EIGENEM Public-Cloud-Projekt
# (saubere Billing-/Netzwerk-Trennung). Dann separate IDs hier einsetzen.
#
# Beschaffung der numerischen IDs (siehe terraform/NEXT_STEPS.md, Schritt 1):
#   cloud_id   = die Public-Cloud-Produkt-ID (Staging nutzt 20126; Prod = eigene
#                ID, falls separates Cloud-Produkt — sonst dieselbe wie Staging).
#   project_id = numerisch aus der Manager-URL des Prod-Projekts, NICHT der
#                PCP-XXXX-Code. Alternativ via API:
#                curl -s -H "Authorization: Bearer $INFOMANIAK_TOKEN" \
#                  "https://api.infomaniak.com/api/v1/products/public_cloud/<cloud_id>/project" \
#                  | jq '.data[] | {id, name, openstack_id}'
# ACHTUNG: Prod im eigenen Terraform-Workspace provisionieren
# (`terraform workspace new production`) — sonst überschreibt der Apply den
# Staging-State. Siehe DEPLOYMENT.md.
infomaniak = {
  cloud_id   = 20126 # Public-Cloud-Produkt (geteilt mit Staging; Isolation via separates Projekt + eigenen Cluster)
  project_id = 43863 # restart-production (OpenStack: PCP-TPSZANM)
}
