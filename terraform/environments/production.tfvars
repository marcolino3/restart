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
infomaniak = {
  cloud_id   = 0 # TODO: cloud_id von restart-production
  project_id = 0 # TODO: numerische project_id von restart-production
}
