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

resolve_main_filter() {
  if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
    echo "pre-push: origin/main not found — run 'git fetch origin' first." >&2
    exit 1
  fi
  run_checks "...[origin/main]" "lint, typecheck, test, build for packages changed since origin/main"
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
  fi
done
