# Security Exceptions

Every GHSA listed in `pnpm.auditConfig.ignoreGhsas` (root `package.json`) MUST have an entry here. An unexplained mute is a bug: remove it or document it.

## Active exceptions

### GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq — image-size DoS (high)

- **Package:** `image-size@1.2.1` (transitive), CVE-2025-71330. Infinite loop in the ICNS/JXL/HEIF parsers on a crafted image buffer blocks the Node.js event loop.
- **No fix exists** (as of 2026-08-24): `first_patched_version: null`, latest release 2.0.2 is itself inside the vulnerable range `<= 2.0.2`. Upstream PR image-size/image-size#439 is open. An override is impossible — there is no version to override to.
- **Dependency chain:** `@better-auth/expo` → optional peers `expo-*` → `expo` → `@expo/cli` / `@expo/metro` → `metro@0.83.3` → `image-size ^1.0.2`.
- **Why the chain cannot be cut:** the backend needs the `expo()` server plugin (`apps/backend/src/lib/auth.ts`) — it rewrites the `expo-origin` header for better-auth's origin check and hands the session cookie to the mobile app via the custom-scheme redirect on `/callback`, `/magic-link/verify` and `/verify-email`. Removing it breaks mobile login. `pnpm.ignoredOptionalDependencies` does not stop the peer resolution (verified 2026-08-24).
- **Why the risk is accepted:** the package ships in the backend production image (verified via `pnpm --filter @restart/backend deploy --prod`) but is never loaded. `@better-auth/expo`'s server entry (`dist/index.js`) imports only `better-auth`, `@better-auth/core/api` and `zod` — nothing from the expo/metro tree. `metro` is a bundler and never starts in the container. No backend code references `image-size`. There is no path that feeds attacker-controlled image buffers into the vulnerable parser.
- **Review trigger:** remove both mutes as soon as image-size publishes a patched release or Expo moves to a metro that drops/patches it. Check on every Expo SDK upgrade and at latest **2026-11-30**.
- **GitHub alerts:** #40, #41 — dismissed as "vulnerable code is not actually used" with reference to this file.

## Removed exceptions

### GHSA-mh99-v99m-4gvg — brace-expansion DoS (high)

Removed 2026-08-24. The mute was stale: all resolved versions in `pnpm-lock.yaml` (1.1.18, 2.1.4, 5.0.9) are at or above the patched versions, enforced by the `brace-expansion` entries in `pnpm.overrides`. `pnpm audit --audit-level high` no longer flags it.
