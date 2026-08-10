import { EntityManager } from 'typeorm';

import { ORG_FEATURE_KEYS } from '@restart/shared-schemas/org-features/feature-catalog';
import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';

/**
 * Seeds one enabled=true row per catalog feature for a newly created org —
 * mirrors the CreateOrganizationFeatureToggles migration's backfill for
 * existing orgs. OrgFeatureGuard/getOrgFeatureCacheEntry require an explicit
 * row instead of defaulting missing rows to enabled, so without this a new
 * org would start with every feature hidden/blocked.
 */
export async function seedOrgFeatureToggles(
  manager: EntityManager,
  organizationId: string,
) {
  const repo = manager.getRepository(OrganizationFeatureToggle);
  const toggles = ORG_FEATURE_KEYS.map((featureKey) =>
    repo.create({ organizationId, featureKey, enabled: true }),
  );
  await repo.insert(toggles);
}
