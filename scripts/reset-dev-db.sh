#!/usr/bin/env bash
#
# Drops the local development database and rebuilds it from scratch:
# TypeORM migrations (which carry the system seeds), the better-auth schema and
# the SuperAdmin bootstrap. Use it when the dev database has accumulated junk —
# for example after debugging an E2E run with E2E_SKIP_TEARDOWN=true.
#
# LOCAL ONLY: refuses to run against anything but a local Postgres.
#
#   sh scripts/reset-dev-db.sh          # asks before dropping
#   sh scripts/reset-dev-db.sh --yes    # no prompt (CI / scripted use)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/backend/.env"

[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }

# Read the DB_* values without executing the rest of the env file.
get_env() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -1 | tr -d '"' | tr -d "'"
}

DB_HOST="$(get_env DB_HOST)"
DB_PORT="$(get_env DB_PORT)"
DB_USERNAME="$(get_env DB_USERNAME)"
DB_PASSWORD="$(get_env DB_PASSWORD)"
DB_NAME="$(get_env DB_NAME)"

case "$DB_HOST" in
  localhost|127.0.0.1|::1) ;;
  *) echo "refusing to reset a non-local database ($DB_HOST)" >&2; exit 1 ;;
esac

if [ "${1:-}" != "--yes" ]; then
  printf 'Drop and rebuild "%s" on %s:%s? All local data is lost. [y/N] ' \
    "$DB_NAME" "$DB_HOST" "$DB_PORT"
  read -r answer
  case "$answer" in
    j|J|y|Y) ;;
    *) echo "aborted"; exit 1 ;;
  esac
fi

export PGPASSWORD="$DB_PASSWORD"
psql_admin() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -v ON_ERROR_STOP=1 "$@"
}

echo "[reset-dev-db] dropping $DB_NAME"
psql_admin -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE);" >/dev/null
psql_admin -c "CREATE DATABASE \"$DB_NAME\";" >/dev/null

echo "[reset-dev-db] running TypeORM migrations (includes the system seeds)"
pnpm --filter @restart/backend migration:run

echo "[reset-dev-db] applying the better-auth schema"
# migrate-auth.ts imports src/lib/auth.ts, which reads its config straight from
# process.env (no dotenv). Export the env file for this step only.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
pnpm --filter @restart/backend auth:migrate

echo "[reset-dev-db] done — start the backend once to bootstrap the SuperAdmin"
