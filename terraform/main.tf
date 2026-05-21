terraform {
  required_version = ">= 1.5"

  required_providers {
    infomaniak = {
      source  = "Infomaniak/infomaniak"
      version = "~> 1.4"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.1"
    }
  }

  # Remote state storage - configure based on your setup
  # backend "s3" {
  #   bucket   = "restart-terraform-state"
  #   key      = "terraform.tfstate"
  #   region   = "eu-west-1"
  #   encrypt  = true
  # }
}
