# Infomaniak Managed Kubernetes Cluster
# Note: Resource names may vary depending on the Infomaniak Terraform provider version.
# Consult https://developer.infomaniak.com for the latest API/resource documentation.

resource "infomaniak_kubernetes" "cluster" {
  name     = var.cluster_name
  location = "dc3-a" # Infomaniak Swiss datacenter

  node_pool {
    name       = "default"
    flavor     = var.node_flavor
    node_count = var.node_count
  }
}

# Namespaces
resource "kubernetes_namespace" "staging" {
  metadata {
    name = "restart-staging"
  }
  depends_on = [infomaniak_kubernetes.cluster]
}

resource "kubernetes_namespace" "production" {
  metadata {
    name = "restart-production"
  }
  depends_on = [infomaniak_kubernetes.cluster]
}
