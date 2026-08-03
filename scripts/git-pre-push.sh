#!/usr/bin/env sh
# Runs lint, test, and build for workspace packages affected by the push.
# Skipped when SKIP_PRE_PUSH=1 or HUSKY=0 (CI / emergency bypass).
set -e

if [ -n "$SKIP_PRE_PUSH" ] || [ "$HUSKY" = "0" ]; then
  exit 0
fi

zero_sha="0000000000000000000000000000000000000000"

# pre-push stdin: <local ref> <local sha> <remote ref> <remote sha>
while read -r local_ref local_sha remote_ref remote_sha; do
  if [ "$local_sha" = "$zero_sha" ]; then
    continue
  fi

  if [ "$remote_sha" = "$zero_sha" ]; then
    if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
      echo "pre-push: origin/main not found — run 'git fetch origin' first." >&2
      exit 1
    fi
    filter="...[origin/main]"
    echo "pre-push: new branch — lint, typecheck, test, build for packages changed since origin/main"
  else
    filter="...[$remote_sha]"
    echo "pre-push: lint, typecheck, test, build for packages changed in this push"
  fi

  pnpm turbo run lint typecheck test build --filter="$filter"
done
