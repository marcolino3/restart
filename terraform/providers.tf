# Infomaniak provider.
# Token wird via TF_VAR_infomaniak_token env var gesetzt (siehe Wrapper-Script
# oder direkt: `TF_VAR_infomaniak_token=$INFOMANIAK_TOKEN terraform ...`).
provider "infomaniak" {
  token = var.infomaniak_token
}

# Kubernetes/Helm-Provider werden direkt aus dem kaas.kubeconfig-Output
# der frisch provisionierten Cluster konfiguriert — keine externe
# kubeconfig-Datei nötig.
locals {
  kubeconfig = yamldecode(infomaniak_kaas.cluster.kubeconfig)
  kube_cluster = local.kubeconfig.clusters[0].cluster
  kube_user    = local.kubeconfig.users[0].user
}

provider "kubernetes" {
  host                   = local.kube_cluster.server
  cluster_ca_certificate = base64decode(local.kube_cluster["certificate-authority-data"])
  client_certificate     = base64decode(local.kube_user["client-certificate-data"])
  client_key             = base64decode(local.kube_user["client-key-data"])
}

provider "helm" {
  kubernetes {
    host                   = local.kube_cluster.server
    cluster_ca_certificate = base64decode(local.kube_cluster["certificate-authority-data"])
    client_certificate     = base64decode(local.kube_user["client-certificate-data"])
    client_key             = base64decode(local.kube_user["client-key-data"])
  }
}
