/**
 * Naming convention for everything the E2E specs and fixtures create in the
 * database.
 *
 * The global teardown (tests/helpers/global-teardown.ts) finds test data by
 * name prefix, so every row a spec creates MUST carry `E2E_NAME_PREFIX` at the
 * start of its `name`, `title`, `note`, `label` or first-name column (or of the row in its
 * `*_translations` table). Rows without the prefix survive the run and
 * accumulate in the local/staging database.
 *
 * Organizations use the narrower `E2E_ORG_PREFIX`, because deleting an
 * organization takes its whole dependency graph with it and must never match
 * anything but a fixture org.
 */
export const E2E_NAME_PREFIX = 'E2E'
export const E2E_ORG_PREFIX = 'E2E Fixture'

/** Unique, teardown-recognisable name for any entity a spec creates. */
export function e2eName(label: string): string {
  return `${E2E_NAME_PREFIX} ${label} ${Date.now()}`
}

/** Unique, teardown-recognisable org name for a fixture-created organization. */
export function e2eOrgName(label = 'Org'): string {
  return `${E2E_ORG_PREFIX} ${label} ${Date.now()}`
}
