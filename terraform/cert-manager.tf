# Install cert-manager via Helm
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "v1.14.4"

  set {
    name  = "installCRDs"
    value = "true"
  }

  depends_on = [infomaniak_kaas_instance_pool.default]
}

# Install NGINX Ingress Controller via Helm
# Service type=LoadBalancer triggers Octavia LB provisioning + Floating-IP
resource "helm_release" "nginx_ingress" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true

  depends_on = [infomaniak_kaas_instance_pool.default]
}

# ClusterIssuer wird via Kustomize deployed (k8s/base/cluster-issuer.yaml),
# nicht via Terraform — kubernetes_manifest würde während `terraform plan`
# eine Live-Cluster-Verbindung erfordern, die es bei erstem Apply noch nicht
# gibt. Saubere Trennung: Infra = Terraform, App-Manifeste = Kustomize.
