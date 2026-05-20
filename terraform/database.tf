# CloudNativePG Operator
#
# Hintergrund: Infomaniak DBaaS bietet aktuell nur MySQL via API, kein
# PostgreSQL — siehe https://www.infomaniak.com/en/hosting/public-cloud/database
# (Stand Mai 2026). Statt zu warten, hosten wir Postgres 16 selbst im Cluster
# via CloudNativePG (CNPG) — ein production-grade Postgres-Operator von EDB,
# voll Open-Source, mit HA, automatischen Failover, deklarativen Backups.
#
# Der eigentliche Postgres-Cluster wird via Kustomize in
# `k8s/base/database.yaml` definiert (Cluster-CRD vom CNPG-Operator).
resource "helm_release" "cloudnative_pg" {
  name             = "cnpg"
  repository       = "https://cloudnative-pg.github.io/charts"
  chart            = "cloudnative-pg"
  namespace        = "cnpg-system"
  create_namespace = true
  version          = "0.22.0"

  depends_on = [infomaniak_kaas_instance_pool.default]
}
