# Production SealedSecrets

Analog zu `k8s/staging/sealed-secrets/README.md`, aber für den Production-
Cluster + Namespace `restart-production`.

```bash
./scripts/bootstrap-secrets.sh production
```

**Wichtig:** Vor der ersten Produktion stellen, dass die Sealing-Keys
gesichert sind:

```bash
AGE_RECIPIENT=<dein-age-pubkey> ./scripts/backup-sealing-keys.sh ~/secure-backup/
```
