/**
 * Naming convention for everything the E2E fixtures create in the database.
 *
 * Every fixture-created organization MUST carry this prefix in its name — the
 * global teardown (tests/helpers/global-teardown.ts) deletes organizations by
 * exactly this prefix, so an unnamed or differently named org would survive
 * the run and accumulate as a leftover in the local/staging database.
 */
export const E2E_ORG_PREFIX = 'E2E Fixture'

/** Unique, teardown-recognisable org name for a fixture-created organization. */
export function e2eOrgName(label = 'Org'): string {
  return `${E2E_ORG_PREFIX} ${label} ${Date.now()}`
}
