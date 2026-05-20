# Infomaniak Managed Kubernetes (kKS / KaaS)
# Docs: https://github.com/Infomaniak/terraform-provider-infomaniak

resource "infomaniak_kaas" "cluster" {
  public_cloud_id         = var.infomaniak.cloud_id
  public_cloud_project_id = var.infomaniak.project_id

  name               = var.cluster_name
  pack_name          = var.cluster_pack
  kubernetes_version = var.kubernetes_version
  region             = var.cluster_region
}

resource "infomaniak_kaas_instance_pool" "default" {
  public_cloud_id         = infomaniak_kaas.cluster.public_cloud_id
  public_cloud_project_id = infomaniak_kaas.cluster.public_cloud_project_id
  kaas_id                 = infomaniak_kaas.cluster.id

  name              = "${var.cluster_name}-default"
  flavor_name       = var.pool_flavor
  availability_zone = var.pool_az
  min_instances     = var.pool_min
  max_instances     = var.pool_max

  labels = {
    "node-role.kubernetes.io/worker" = "true"
  }
}

# Namespaces (created in-cluster via kubeconfig from kaas resource)
resource "kubernetes_namespace" "app" {
  metadata {
    name = "restart-${var.environment}"
  }
  depends_on = [infomaniak_kaas_instance_pool.default]
}
