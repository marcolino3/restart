import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationFeatureTogglesResolver } from './organization-feature-toggles.resolver';
import { OrganizationFeatureTogglesService } from './organization-feature-toggles.service';
import { UpdateOrganizationFeatureToggleInput } from './dto/update-organization-feature-toggle.input';
import { BulkUpdateOrganizationFeatureTogglesInput } from './dto/bulk-update-organization-feature-toggles.input';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { OrgFeatureKey } from '@restart/shared-schemas/org-features/feature-catalog';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const superAdmin = {
  sub: 'user-sa',
  roles: [],
  permissions: [],
  isSuperAdmin: true,
} as unknown as TokenPayload;

// Prototype-Methoden ohne Member-Access referenzieren (unbound-method-Regel)
const methodOf = (name: keyof OrganizationFeatureTogglesResolver): object =>
  Object.getOwnPropertyDescriptor(
    OrganizationFeatureTogglesResolver.prototype,
    name,
  )?.value as object;

describe('OrganizationFeatureTogglesResolver', () => {
  let resolver: OrganizationFeatureTogglesResolver;
  let service: {
    findAllForOrg: jest.Mock;
    setEnabled: jest.Mock;
    bulkSetEnabled: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAllForOrg: jest.fn(),
      setEnabled: jest.fn(),
      bulkSetEnabled: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationFeatureTogglesResolver,
        { provide: OrganizationFeatureTogglesService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(OrganizationFeatureTogglesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('organizationFeatureToggles', () => {
    it('delegates to the service with the given org id', async () => {
      const toggles = [{ featureKey: OrgFeatureKey.TIME_TRACKING }];
      service.findAllForOrg.mockResolvedValue(toggles);

      await expect(resolver.organizationFeatureToggles('org-1')).resolves.toBe(
        toggles,
      );
      expect(service.findAllForOrg).toHaveBeenCalledWith('org-1');
    });
  });

  describe('updateOrganizationFeatureToggle', () => {
    it('delegates to the service with the acting user id', async () => {
      const input = {
        organizationId: 'org-1',
        featureKey: OrgFeatureKey.TIME_TRACKING,
        enabled: true,
      } as UpdateOrganizationFeatureToggleInput;
      const result = [{ featureKey: OrgFeatureKey.TIME_TRACKING }];
      service.setEnabled.mockResolvedValue(result);

      await expect(
        resolver.updateOrganizationFeatureToggle(input, superAdmin),
      ).resolves.toBe(result);
      expect(service.setEnabled).toHaveBeenCalledWith(
        'org-1',
        OrgFeatureKey.TIME_TRACKING,
        true,
        superAdmin.sub,
      );
    });
  });

  describe('bulkUpdateOrganizationFeatureToggles', () => {
    it('delegates to the service with the acting user id', async () => {
      const input = {
        organizationId: 'org-1',
        updates: [
          { featureKey: OrgFeatureKey.TIME_TRACKING, enabled: true },
          { featureKey: OrgFeatureKey.CHATS, enabled: false },
        ],
      } as BulkUpdateOrganizationFeatureTogglesInput;
      const result = [
        { featureKey: OrgFeatureKey.TIME_TRACKING },
        { featureKey: OrgFeatureKey.CHATS },
      ];
      service.bulkSetEnabled.mockResolvedValue(result);

      await expect(
        resolver.bulkUpdateOrganizationFeatureToggles(input, superAdmin),
      ).resolves.toBe(result);
      expect(service.bulkSetEnabled).toHaveBeenCalledWith(
        'org-1',
        [
          { featureKey: OrgFeatureKey.TIME_TRACKING, enabled: true },
          { featureKey: OrgFeatureKey.CHATS, enabled: false },
        ],
        superAdmin.sub,
      );
    });
  });

  describe('SuperAdmin-only operations keep their guards', () => {
    it.each([
      ['organizationFeatureToggles', methodOf('organizationFeatureToggles')],
      [
        'updateOrganizationFeatureToggle',
        methodOf('updateOrganizationFeatureToggle'),
      ],
      [
        'bulkUpdateOrganizationFeatureToggles',
        methodOf('bulkUpdateOrganizationFeatureToggles'),
      ],
    ])('%s requires SuperAdminGuard', (_name, handler) => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];
      expect(guards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, SuperAdminGuard]),
      );
    });
  });
});
