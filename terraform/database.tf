# Infomaniak Managed PostgreSQL
# Note: Resource names may vary depending on the Infomaniak Terraform provider version.
# Consult https://developer.infomaniak.com for the latest API/resource documentation.

resource "infomaniak_database" "postgres" {
  name     = "restart-${var.environment}"
  type     = "postgresql"
  version  = var.db_version
  flavor   = var.db_flavor
  password = var.db_password
}
