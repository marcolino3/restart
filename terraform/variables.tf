variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

# Infomaniak target project.
# - cloud_id   : numeric Public Cloud ID (im Manager URL sichtbar)
# - project_id : NUMERISCHE Projekt-ID (NICHT der PCP-XXXXX-String!).
#   Zu finden im Manager: Projekt öffnen, dann in der URL hinter
#   .../projects/<NUMBER>/... auslesen
variable "infomaniak" {
  description = "Infomaniak target project IDs"
  type = object({
    cloud_id   = number
    project_id = number
  })
  nullable = false
}

# Token via TF_VAR_infomaniak_token env var setzen (NICHT in tfvars committen).
variable "infomaniak_token" {
  description = "Infomaniak API token (set via TF_VAR_infomaniak_token env var)"
  type        = string
  sensitive   = true
  nullable    = false
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "restart-cluster"
}

variable "cluster_region" {
  description = "Cluster region (Swiss DCs only: dc3-a, dc4-a)"
  type        = string
  default     = "dc4-a"
}

variable "cluster_pack" {
  description = "Control-plane tier: 'shared' (gratis, max 10 Nodes) or 'dedicated_4' / 'dedicated_8' / 'dedicated_16' (dediziert, SLA 99.9%, RAM des Control-Plane)"
  type        = string
  default     = "shared"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.31"
}

variable "pool_flavor" {
  description = "Worker-Node instance flavor"
  type        = string
  default     = "a2-ram4-disk20-perf1"
}

variable "pool_az" {
  description = "Pool availability zone (az-1, az-2, az-3 — Genf)"
  type        = string
  default     = "az-2"
}

variable "pool_min" {
  description = "Minimum number of worker nodes (autoscaler lower bound)"
  type        = number
  default     = 2
}

variable "pool_max" {
  description = "Maximum number of worker nodes (set equal to pool_min to disable autoscaling)"
  type        = number
  default     = 2
}

variable "letsencrypt_email" {
  description = "Email for Let's Encrypt certificate notifications"
  type        = string
}
