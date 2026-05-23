# Postgres läuft als externe VM auf der Infomaniak Public Cloud — nicht im Cluster.
#
# Warum nicht CNPG/in-cluster:
# Infomaniak Managed K8s (Stand Mai 2026) routet die kube-apiserver-VIP
# (10.96.0.1) nicht zuverlässig aus den Pods. CNPG-initdb braucht diese
# Verbindung um den Cluster-Status zu synchronisieren — sonst timeouted es
# endlos in "Setting up primary". CNI/Konnectivity-spezifisch
# (Cilium-eBPF + konnectivity-server bei Infomaniak).
#
# Bootstrap der externen VM (einmalig pro Env):
#  1. Horizon → Compute → Launch Instance: Ubuntu 24.04, Flavor 2GB RAM
#     Name: postgres-{staging|production}
#  2. Customization Script (Cloud-Init): installiert Postgres 16, legt
#     DB + User + Extensions an. Siehe Kommentar unten.
#  3. Floating-IP allokieren + assoziieren
#  4. Security Group: 5432/tcp + 22/tcp Ingress von 0.0.0.0/0
#  5. In apps/backend/.env.{staging|production}:
#     DB_HOST=<floating-ip>, DB_PASSWORD=<starkes-pw>
#  6. ./scripts/bootstrap-secrets.sh {staging|production}
#
# Customization-Script-Skeleton (Passwort ersetzen):
#   #!/bin/bash
#   set -e
#   CODENAME=$(. /etc/os-release && echo $VERSION_CODENAME)
#   apt-get update && apt-get install -y curl ca-certificates ufw
#   install -d /usr/share/postgresql-common/pgdg
#   curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
#     https://www.postgresql.org/media/keys/ACCC4CF8.asc
#   echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
#     https://apt.postgresql.org/pub/repos/apt ${CODENAME}-pgdg main" \
#     > /etc/apt/sources.list.d/pgdg.list
#   apt-get update && apt-get install -y postgresql-16
#   sudo -u postgres psql <<EOF
#     CREATE USER restart WITH PASSWORD '<STARK>';
#     CREATE DATABASE restart OWNER restart;
#     \c restart
#     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
#     CREATE EXTENSION IF NOT EXISTS "pgcrypto";
#     CREATE EXTENSION IF NOT EXISTS "pg_trgm";
#   EOF
#   sed -i "s/^#listen_addresses.*/listen_addresses = '*'/" \
#     /etc/postgresql/16/main/postgresql.conf
#   echo "host restart restart 0.0.0.0/0 scram-sha-256" \
#     >> /etc/postgresql/16/main/pg_hba.conf
#   systemctl restart postgresql
#
# Wenn Infomaniak später Postgres als Managed DBaaS anbietet oder das
# kube-apiserver-Routing fixt, kann CNPG wieder rein.
