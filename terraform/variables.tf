variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "restart-cluster"
}

variable "node_count" {
  description = "Number of nodes in the node pool"
  type        = number
  default     = 2
}

variable "node_flavor" {
  description = "Node instance type/flavor"
  type        = string
  default     = "a2-ram4-disk20-perf1"
}

variable "db_flavor" {
  description = "Database instance type/flavor"
  type        = string
  default     = "a1-ram2-disk20"
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "letsencrypt_email" {
  description = "Email for Let's Encrypt certificate notifications"
  type        = string
}
