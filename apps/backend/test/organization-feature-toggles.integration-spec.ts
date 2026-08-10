/**
 * Multi-tenant isolation + permission tests for org feature toggles.
 *
 * Requires a running PostgreSQL test database.
 * Start it with: docker compose -f docker-compose.test.yml up -d
 * Run with: npx jest --config ./test/jest-e2e.json --testPathPatterns=organization-feature-toggles.integration
 */
import { DataSource } from 'typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { OrganizationFeatureTogglesService } from '@/organizations/organization-feature-toggles.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';
import { User } from '@/users/entities/user.entity';
import { OrgFeatureGuard } from '@/auth/guard/org-feature.guard';
import { OrgFeatureKey } from '@restart/shared-schemas/org-features/feature-catalog';
import { __clearOrgFeatureCacheForTests } from '@/organizations/utils/org-feature-cache';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { createTestingApp, cleanDatabase } from './test-utils';

/**
 * Inlined instead of importing @/common/testing/auth-test.util, which pulls
 * in GqlBetterAuthGuard and thereby the real better-auth ESM package —
 * unparseable under test/jest-e2e.json (no better-auth mock there, unlike
 * the unit-test jest config in package.json).
 */
function mockUser(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    sub: '11111111-1111-1111-1111-111111111111',
    orgId: 'org-1',
    membershipId: 'membership-1',
    roles: [],
    permissions: [],
    isSuperAdmin: false,
    ...overrides,
  };
}

function mockGqlExecutionContext(opts: {
  user?: Partial<TokenPayload> | null;
  handler?: (...args: never[]) => unknown;
}): ExecutionContext {
  const req = { user: opts.user ?? undefined };
  const gqlArgs = [undefined, undefined, { req }, undefined];
  const handler = opts.handler ?? (() => undefined);

  return {
    getType: () => 'graphql',
    getClass: () => class {},
    getHandler: () => handler,
    getArgs: () => gqlArgs,
    getArgByIndex: (i: number) => gqlArgs[i],
    switchToHttp: () => ({ getRequest: () => req }),
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
  } as unknown as ExecutionContext;
}

/**
 * Minimal module for these tests — deliberately avoids OrganizationsModule,
 * whose resolver pulls in the real better-auth guard chain (ESM, not
 * transformable by ts-jest under test/jest-e2e.json).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationFeatureToggle, User]),
  ],
  providers: [OrganizationFeatureTogglesService],
})
class OrgFeatureTogglesTestModule {}

describe('OrganizationFeatureToggles (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: OrganizationFeatureTogglesService;
  let guard: OrgFeatureGuard;

  beforeAll(async () => {
    const app = await createTestingApp([OrgFeatureTogglesTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(OrganizationFeatureTogglesService);
    guard = new OrgFeatureGuard(new Reflector(), dataSource.manager);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    __clearOrgFeatureCacheForTests();
    await cleanDatabase(dataSource);
  });

  async function createOrg(): Promise<Organization> {
    return dataSource
      .getRepository(Organization)
      .save(dataSource.getRepository(Organization).create({}));
  }

  async function createUser(): Promise<User> {
    return dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        firstName: 'Test',
        lastName: 'User',
      }),
    );
  }

  it('disabling a feature blocks access for that org via the guard', async () => {
    const org = await createOrg();
    const user = await createUser();
    await service.setEnabled(org.id, OrgFeatureKey.CHATS, false, user.id);

    const ctx = mockGqlExecutionContext({
      user: mockUser({ orgId: org.id }),
      handler: (() => {
        const h = () => undefined;
        Reflect.defineMetadata('orgFeatureRequired', OrgFeatureKey.CHATS, h);
        return h;
      })(),
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('enabling a feature for one org does not leak to another org (multi-tenant isolation)', async () => {
    const orgA = await createOrg();
    const orgB = await createOrg();
    const user = await createUser();
    await service.setEnabled(orgA.id, OrgFeatureKey.CHATS, true, user.id);
    await service.setEnabled(orgB.id, OrgFeatureKey.CHATS, false, user.id);

    const handler = () => undefined;
    Reflect.defineMetadata('orgFeatureRequired', OrgFeatureKey.CHATS, handler);

    const ctxA = mockGqlExecutionContext({
      user: mockUser({ orgId: orgA.id }),
      handler,
    });
    const ctxB = mockGqlExecutionContext({
      user: mockUser({ orgId: orgB.id }),
      handler,
    });

    await expect(guard.canActivate(ctxA)).resolves.toBe(true);
    await expect(guard.canActivate(ctxB)).rejects.toThrow(ForbiddenException);
  });

  it('findAllForOrg returns the full feature catalog even before any toggle row exists', async () => {
    const org = await createOrg();
    const toggles = await service.findAllForOrg(org.id);
    expect(toggles.map((t) => t.featureKey).sort()).toEqual(
      [
        OrgFeatureKey.CHATS,
        OrgFeatureKey.MY_TASKS,
        OrgFeatureKey.PROJECTS,
        OrgFeatureKey.PROTOCOLS,
        OrgFeatureKey.TIME_TRACKING,
      ].sort(),
    );
  });

  it('setEnabled persists changedBy and enforces one row per (org, feature)', async () => {
    const org = await createOrg();
    const user = await createUser();
    await service.setEnabled(org.id, OrgFeatureKey.PROJECTS, false, user.id);
    await service.setEnabled(org.id, OrgFeatureKey.PROJECTS, true, user.id);

    const rows = await dataSource
      .getRepository(OrganizationFeatureToggle)
      .find({
        where: { organizationId: org.id, featureKey: OrgFeatureKey.PROJECTS },
      });
    expect(rows).toHaveLength(1);
    expect(rows[0].enabled).toBe(true);
    expect(rows[0].changedById).toBe(user.id);
  });
});
