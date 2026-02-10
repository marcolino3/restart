provider "infomaniak" {
  # API token set via INFOMANIAK_API_TOKEN env var
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}
