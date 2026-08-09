#!/usr/bin/env sh
# Pre-push quality gate: lint → typecheck → test → build for affected workspace packages.
# Invoked by Husky (.husky/pre-push) or manually via `pnpm prepush`.
# Bypass: SKIP_PRE_PUSH=1 or HUSKY=0
set -e

if [ -n "$SKIP_PRE_PUSH" ] || [ "$HUSKY" = "0" ]; then
  exit 0
fi

zero_sha="0000000000000000000000000000000000000000"

run_checks() {
  local filter="$1"
  local label="$2"
  echo "pre-push: $label"
  pnpm turbo run lint typecheck test build --filter="$filter"
}

# Codegen drift: if backend source changed, the generated GraphQL types in
# packages/shared-types must be regenerated and committed, or CI's
# "Codegen Drift Check" fails an entire CI round later. Requires the local
# backend to be running on :4001 (pnpm --filter @restart/backend dev).
drift_check() {
  if git diff --quiet origin/main...HEAD -- apps/backend/src apps/web; then
    return 0
  fi
  echo "pre-push: codegen drift check (backend/web changed)"
  if ! curl -sf http://localhost:4001/api/health >/dev/null 2>&1; then
    echo "pre-push: backend not running on :4001 — start it (pnpm --filter @restart/backend dev) so the codegen drift check can run, or bypass with SKIP_PRE_PUSH=1." >&2
    exit 1
  fi
  pnpm --filter @restart/web codegen >/dev/null
  if ! git diff --exit-code --stat -- packages/shared-types; then
    echo "pre-push: generated GraphQL types are out of date — commit the regenerated packages/shared-types before pushing." >&2
    exit 1
  fi
}

resolve_main_filter() {
  if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
    echo "pre-push: origin/main not found — run 'git fetch origin' first." >&2
    exit 1
  fi
  run_checks "...[origin/main]" "lint, typecheck, test, build for packages changed since origin/main"
  drift_check
}

# Manual invocation: pnpm prepush
if [ "${1:-}" = "--manual" ]; then
  resolve_main_filter
  exit 0
fi

# Git pre-push stdin: <local ref> <local sha> <remote ref> <remote sha>
while read -r local_ref local_sha remote_ref remote_sha; do
  if [ "$local_sha" = "$zero_sha" ]; then
    continue
  fi

  if [ "$remote_sha" = "$zero_sha" ]; then
    resolve_main_filter
  else
    run_checks "...[$remote_sha]" "lint, typecheck, test, build for packages changed in this push"
    drift_check
  fi
done
