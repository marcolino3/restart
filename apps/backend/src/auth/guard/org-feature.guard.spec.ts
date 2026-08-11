import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { EntityManager } from 'typeorm';

import { OrgFeatureGuard } from './org-feature.guard';
import { ORG_FEATURE_REQUIRED_KEY } from '@/auth/decorators/org-feature-required.decorator';
import { OrgFeatureKey } from '@restart/shared-schemas/org-features/feature-catalog';
import { __clearOrgFeatureCacheForTests } from '@/organizations/utils/org-feature-cache';
import {
  mockGqlExecutionContext,
  mockUser,
} from '@/common/testing/auth-test.util';

/** A handler carrying the given required-feature metadata. */
function handlerRequiring(featureKey?: OrgFeatureKey): () => void {
  const handler = () => undefined;
  if (featureKey) {
    Reflect.defineMetadata(ORG_FEATURE_REQUIRED_KEY, featureKey, handler);
  }
  return handler;
}

/** Minimal EntityManager stub covering the query-builder chain the cache uses. */
function mockEntityManager(opts: {
  maxUpdatedAt: Date | null;
  toggles: { featureKey: string; enabled: boolean }[];
}): EntityManager {
  const qb = {
    where: () => qb,
    select: () => qb,
    getRawOne: () => Promise.resolve({ maxUpdatedAt: opts.maxUpdatedAt }),
  };
  return {
    createQueryBuilder: () => qb,
    find: () => Promise.resolve(opts.toggles.filter((t) => t.enabled)),
  } as unknown as EntityManager;
}

describe('OrgFeatureGuard', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    __clearOrgFeatureCacheForTests();
  });

  it('allows when no feature is required', async () => {
    const em = mockEntityManager({ maxUpdatedAt: null, toggles: [] });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser(),
      handler: handlerRequiring(),
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('lets SuperAdmin bypass a disabled feature', async () => {
    const em = mockEntityManager({ maxUpdatedAt: null, toggles: [] });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser({ isSuperAdmin: true }),
      handler: handlerRequiring(OrgFeatureKey.CHATS),
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects a request with no active org', async () => {
    const em = mockEntityManager({ maxUpdatedAt: null, toggles: [] });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser({ orgId: undefined }),
      handler: handlerRequiring(OrgFeatureKey.CHATS),
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('allows when the feature is enabled for the org', async () => {
    const em = mockEntityManager({
      maxUpdatedAt: new Date('2026-01-01'),
      toggles: [{ featureKey: OrgFeatureKey.CHATS, enabled: true }],
    });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser(),
      handler: handlerRequiring(OrgFeatureKey.CHATS),
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects when the feature is disabled for the org', async () => {
    const em = mockEntityManager({
      maxUpdatedAt: new Date('2026-01-01'),
      toggles: [{ featureKey: OrgFeatureKey.CHATS, enabled: false }],
    });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser(),
      handler: handlerRequiring(OrgFeatureKey.CHATS),
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects when the org has no row for the feature at all', async () => {
    // No explicit row (e.g. new feature key not yet seeded for this org) must
    // NOT default to enabled — the migration seeds every org explicitly.
    const em = mockEntityManager({
      maxUpdatedAt: new Date('2026-01-01'),
      toggles: [{ featureKey: OrgFeatureKey.PROJECTS, enabled: true }],
    });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser(),
      handler: handlerRequiring(OrgFeatureKey.CHATS),
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects a dependent feature when its parent is disabled', async () => {
    // TIME_REPORTS depends on TIME_TRACKING — even if TIME_REPORTS itself
    // has an enabled row, a disabled parent must still block it.
    const em = mockEntityManager({
      maxUpdatedAt: new Date('2026-01-01'),
      toggles: [
        { featureKey: OrgFeatureKey.TIME_REPORTS, enabled: true },
        { featureKey: OrgFeatureKey.TIME_TRACKING, enabled: false },
      ],
    });
    const guard = new OrgFeatureGuard(reflector, em);
    const ctx = mockGqlExecutionContext({
      user: mockUser(),
      handler: handlerRequiring(OrgFeatureKey.TIME_REPORTS),
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
