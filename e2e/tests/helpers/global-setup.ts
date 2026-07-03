import type { FullConfig } from '@playwright/test'

/**
 * Seeds a better-auth credential account for the superadmin so the
 * authenticated E2E suites can sign in through the real UI login.
 *
 * The backend's SuperAdminBootstrapService seeds the TypeORM user
 * (isSuperAdmin=true, password hash in `user_emails`), but better-auth keeps
 * its own `user`/`account` tables and hashes with scrypt — a fresh database
 * therefore has no credential account and UI login fails. We create it once
 * here via better-auth's public sign-up endpoint using the SAME email the
 * bootstrap seeded, so the session resolves back to the superadmin TypeORM
 * user by email. Idempotent: an already-existing account is ignored.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
// better-auth rejects state-changing requests without a trusted Origin
// (CSRF guard). Use the frontend origin, which is in trustedOrigins /
// ALLOWED_ORIGINS both locally and in CI.
const ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4000'
const EMAIL = process.env.SUPERADMIN_EMAIL ?? 'marco@marranchelli.com'
const PASSWORD = process.env.SUPERADMIN_PASSWORD ?? 'change-me'

async function waitForBackend(timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      })
      if (res.ok) return
      lastErr = new Error(`GraphQL responded ${res.status}`)
    } catch (err) {
      lastErr = err
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(
    `Backend not reachable at ${BACKEND_URL} within ${timeoutMs}ms: ${String(lastErr)}`,
  )
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await waitForBackend()

  const res = await fetch(`${BACKEND_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Super Admin' }),
  })

  if (res.ok) {
    // eslint-disable-next-line no-console
    console.log(`[global-setup] seeded better-auth credential for ${EMAIL}`)
    return
  }

  // Already exists (repeated local runs / warm DB) → not an error. better-auth
  // returns 422/400 with a "already exists"-style message in that case.
  const body = await res.text().catch(() => '')
  if (/exist|already|unique/i.test(body) || res.status === 422 || res.status === 400) {
    // eslint-disable-next-line no-console
    console.log(`[global-setup] credential for ${EMAIL} already present — ok`)
    return
  }

  throw new Error(
    `[global-setup] sign-up failed (${res.status}) for ${EMAIL}: ${body.slice(0, 300)}`,
  )
}
