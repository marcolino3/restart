output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = infomaniak_kaas.cluster.name
}

output "kubeconfig" {
  description = "Cluster kubeconfig content (YAML)"
  value       = infomaniak_kaas.cluster.kubeconfig
  sensitive   = true
}

# Postgres-Connection-Details kommen NICHT aus Terraform, sondern aus dem
# Secret, das CloudNativePG automatisch erzeugt:
#   kubectl get secret restart-db-app -n restart-${environment} -o yaml
# Inhalt: username, password, host, port, dbname, jdbc-uri, uri
