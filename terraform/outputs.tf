output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = infomaniak_kubernetes.cluster.name
}

output "database_host" {
  description = "PostgreSQL database host"
  value       = infomaniak_database.postgres.hostname
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = infomaniak_database.postgres.name
}
