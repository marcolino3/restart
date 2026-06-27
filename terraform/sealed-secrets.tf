# Sealed-Secrets Controller (Bitnami)
#
# Erlaubt es, K8s Secrets verschlüsselt im Git zu committen. Nur dieser
# Controller (im Cluster, mit Privat-Schlüssel) kann sie entschlüsseln.
#
# Architektur:
#   1. Controller generiert ein RSA-Keypair beim ersten Start und speichert
#      es als Secret `sealed-secrets-key` im Namespace `kube-system`.
#   2. `kubeseal` CLI holt den Public-Key vom Cluster und verschlüsselt
#      lokale Secrets zu `SealedSecret`-Manifesten.
#   3. SealedSecrets werden ins Git committed; im Cluster entschlüsselt der
#      Controller sie automatisch zu echten Secrets.
#
# Disaster Recovery: Den Private-Key regelmäßig sichern!
#   kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key=active -o yaml > sealed-secrets-backup.yaml
# Diesen Dump verschlüsselt (age/gpg) offline aufbewahren — bei Cluster-Verlust
# können sonst alle verschlüsselten Secrets nicht mehr gelesen werden.
resource "helm_release" "sealed_secrets" {
  name             = "sealed-secrets"
  repository       = "https://bitnami.github.io/sealed-secrets"
  chart            = "sealed-secrets"
  namespace        = "kube-system"
  create_namespace = false
  version          = "2.16.1"

  # Standard-Release-Name "sealed-secrets-controller" beibehalten, damit
  # `kubeseal` ohne Extra-Flags funktioniert.
  set {
    name  = "fullnameOverride"
    value = "sealed-secrets-controller"
  }

  # Key-Rotation: alle 30 Tage neuen Sealing-Key generieren. Alte Keys
  # bleiben aktiv, sodass bestehende SealedSecrets weiter funktionieren.
  set {
    name  = "keyrenewperiod"
    value = "720h"
  }

  depends_on = [infomaniak_kaas_instance_pool.default]
}
