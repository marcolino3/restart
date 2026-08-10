// Org-scoped in-memory cache for OrganizationFeatureToggle lookups, mirrors
// role-permission-cache.ts. Versioned by MAX(updatedAt) per org — no TTL
// guessing, no cross-pod invalidation, every pod reads the same version from
// the DB so a toggle edit on any pod is visible to all pods on their next
// request.
import { EntityManager } from 'typeorm';

import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';

type OrgFeatureCacheEntry = {
  version: string;
  enabledFeatures: Set<string>;
};

const cacheByOrg = new Map<string, OrgFeatureCacheEntry>();

async function loadOrgFeatureVersion(
  em: EntityManager,
  orgId: string,
): Promise<string> {
  const row = await em
    .createQueryBuilder(OrganizationFeatureToggle, 't')
    .where('t.organization_id = :orgId', { orgId })
    .select('MAX(t.updatedAt)', 'maxUpdatedAt')
    .getRawOne<{ maxUpdatedAt: Date | null }>();
  return row?.maxUpdatedAt ? row.maxUpdatedAt.toISOString() : 'empty';
}

async function loadOrgFeatureCacheEntry(
  em: EntityManager,
  orgId: string,
  version: string,
): Promise<OrgFeatureCacheEntry> {
  // Mirrors OrganizationFeatureTogglesService.findAllForOrg: a feature key
  // without a stored row defaults to enabled until a SuperAdmin explicitly
  // disables it, so newly created orgs (and newly added catalog keys) start
  // with the full feature set rather than none.
  const rows = await em.find(OrganizationFeatureToggle, {
    where: { organizationId: orgId, enabled: true },
  });
  return {
    version,
    enabledFeatures: new Set(rows.map((r) => r.featureKey)),
  };
}

export async function getOrgFeatureCacheEntry(
  em: EntityManager,
  orgId: string,
): Promise<OrgFeatureCacheEntry> {
  const version = await loadOrgFeatureVersion(em, orgId);
  const cached = cacheByOrg.get(orgId);
  if (cached && cached.version === version) {
    return cached;
  }
  const entry = await loadOrgFeatureCacheEntry(em, orgId, version);
  cacheByOrg.set(orgId, entry);
  return entry;
}

export function isOrgFeatureEnabled(
  entry: OrgFeatureCacheEntry,
  featureKey: string,
): boolean {
  return entry.enabledFeatures.has(featureKey);
}

// Test-only: clears the module-level cache between test cases/orgs.
export function __clearOrgFeatureCacheForTests(): void {
  cacheByOrg.clear();
}
