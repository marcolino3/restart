# Staging SealedSecrets

Dieses Verzeichnis enthält **verschlüsselte** Secrets, die sicher im Git
committed werden können. Nur der `sealed-secrets-controller` im Cluster
(Namespace `kube-system`) kann sie entschlüsseln.

## Erstellen / Aktualisieren

Aus einer lokalen `.env`-Datei:

```bash
./scripts/seal-secret.sh \
    --name backend-secrets \
    --namespace restart-staging \
    --from-env ./apps/backend/.env.staging \
    --output k8s/staging/sealed-secrets/backend-secrets.yaml
```

Oder alle Secrets einer Umgebung auf einmal (liest `.env.staging` aus
`apps/backend/` und `apps/web/`):

```bash
./scripts/bootstrap-secrets.sh staging
```

Danach: committen + pushen. Kustomize verbaut die SealedSecrets automatisch
in den Apply, der Controller entschlüsselt sie im Cluster.

## NICHT committen

- Echte `.env.staging` / `.env.production` Dateien
- Klartext-Secrets (`*.secret.yaml`, `secrets-plain.yaml`)
- Master-Key-Dumps

Alles drei ist über `.gitignore` ausgeschlossen.
