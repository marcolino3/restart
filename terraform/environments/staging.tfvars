environment        = "staging"
cluster_name       = "restart-staging"
cluster_region     = "dc4-a"
cluster_pack       = "shared" # gratis, max 10 Nodes — ok für Staging
kubernetes_version = "1.33"

pool_flavor = "a2-ram4-disk20-perf1"
pool_az     = "az-2"
pool_min    = 2
pool_max    = 2

letsencrypt_email = "marco@marranchelli.com"

# Infomaniak-Credentials — cloud_id ist bekannt (20126),
# project_id muss NUMERISCH sein (NICHT "PCP-NB77OND"!).
# Siehe NEXT_STEPS.md für Anleitung, wie du die numerische ID findest.
infomaniak = {
  cloud_id   = 20126
  project_id = 42211
}
# Token: TF_VAR_infomaniak_token="$INFOMANIAK_TOKEN" terraform ...
