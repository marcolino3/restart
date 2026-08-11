import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationInput } from './dto/update-organization.input';
import { CreateOrganizationInput } from './dto/create-organization.input';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { SystemRole } from '@/roles/entities/system-role.enum';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const regularUser: TokenPayload = {
  sub: 'user-1',
  orgId: ORG_ID,
  isSuperAdmin: false,
};

const orgAdmin = {
  sub: 'user-1',
  orgId: ORG_ID,
  roles: [SystemRole.ORG_ADMIN],
  permissions: [],
  isSuperAdmin: false,
} as unknown as TokenPayload;

const superAdmin = {
  sub: 'user-sa',
  roles: [],
  permissions: [],
  isSuperAdmin: true,
} as unknown as TokenPayload;

// Prototype-Methoden ohne Member-Access referenzieren (unbound-method-Regel)
const methodOf = (name: keyof OrganizationsResolver): object =>
  Object.getOwnPropertyDescriptor(OrganizationsResolver.prototype, name)
    ?.value as object;

describe('OrganizationsResolver', () => {
  let resolver: OrganizationsResolver;
  let service: {
    create: jest.Mock;
    findAllForUser: jest.Mock;
    findOneForUser: jest.Mock;
    updateOrganization: jest.Mock;
    removeOrganization: jest.Mock;
    isSubdomainAvailable: jest.Mock;
    isDomainAvailable: jest.Mock;
    getOrganizationsOverview: jest.Mock;
    getOrganizationUsage: jest.Mock;
    suspendOrganization: jest.Mock;
    reactivateOrganization: jest.Mock;
    changeOrganizationPlan: jest.Mock;
    getOrganizationAuditLog: jest.Mock;
    exportOrganizationData: jest.Mock;
    getOrganizationOwner: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAllForUser: jest.fn(),
      findOneForUser: jest.fn(),
      updateOrganization: jest.fn(),
      removeOrganization: jest.fn(),
      isSubdomainAvailable: jest.fn(),
      isDomainAvailable: jest.fn(),
      getOrganizationsOverview: jest.fn(),
      getOrganizationUsage: jest.fn(),
      suspendOrganization: jest.fn(),
      reactivateOrganization: jest.fn(),
      changeOrganizationPlan: jest.fn(),
      getOrganizationAuditLog: jest.fn(),
      exportOrganizationData: jest.fn(),
      getOrganizationOwner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsResolver,
        { provide: OrganizationsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<OrganizationsResolver>(OrganizationsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createOrganization', () => {
    it('delegates to the service', async () => {
      const created = { id: 'org-new' };
      service.create.mockResolvedValue(created);
      const input = { organizationName: 'New Org' } as CreateOrganizationInput;

      await expect(resolver.createOrganization(input)).resolves.toBe(created);
      expect(service.create).toHaveBeenCalledWith(input);
    });
  });

  describe('organizations', () => {
    it('scopes the listing to the calling user (org isolation)', async () => {
      const orgs = [{ id: 'org-1' }];
      service.findAllForUser.mockResolvedValue(orgs);

      await expect(resolver.organizations(regularUser)).resolves.toBe(orgs);
      // MUST pass the caller's token payload so the service can filter by membership
      expect(service.findAllForUser).toHaveBeenCalledWith(regularUser);
    });
  });

  describe('organization', () => {
    it('passes id and the calling user to the access-checked lookup (org isolation)', async () => {
      const org = { id: 'org-1' };
      service.findOneForUser.mockResolvedValue(org);

      await expect(resolver.organization('org-1', regularUser)).resolves.toBe(
        org,
      );
      expect(service.findOneForUser).toHaveBeenCalledWith('org-1', regularUser);
    });

    it('propagates access errors from the service', async () => {
      const error = new Error('No access to this organization');
      service.findOneForUser.mockRejectedValue(error);

      await expect(
        resolver.organization('foreign-org', regularUser),
      ).rejects.toBe(error);
    });
  });

  describe('updateOrganization (regression: cross-tenant write was possible)', () => {
    const makeInput = (id: string) =>
      ({ id, name: 'Evil Corp' }) as UpdateOrganizationInput;

    beforeEach(() => {
      service.updateOrganization.mockResolvedValue({});
    });

    it('multi-tenant isolation: rejects updates targeting a foreign organization', () => {
      expect(() =>
        resolver.updateOrganization(makeInput(OTHER_ORG_ID), orgAdmin),
      ).toThrow(NotFoundException);
      expect(service.updateOrganization).not.toHaveBeenCalled();
    });

    it('allows an org admin to update the own organization', async () => {
      await resolver.updateOrganization(makeInput(ORG_ID), orgAdmin);
      expect(service.updateOrganization).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ id: ORG_ID }),
      );
    });

    it('allows SuperAdmin to update any organization', async () => {
      await resolver.updateOrganization(makeInput(OTHER_ORG_ID), superAdmin);
      expect(service.updateOrganization).toHaveBeenCalledWith(
        OTHER_ORG_ID,
        expect.objectContaining({ id: OTHER_ORG_ID }),
      );
    });

    it('strips SuperAdmin-only billing/lifecycle fields for an org admin (privilege escalation)', async () => {
      const input = {
        id: ORG_ID,
        name: 'Renamed School',
        plan: 'ENTERPRISE',
        userLicenseLimit: 999,
        billingAmountChf: 0,
        lifecycleStatus: 'ACTIVE',
        trialEndsAt: '2099-01-01',
        isActive: true,
        isArchived: false,
      } as UpdateOrganizationInput;

      await resolver.updateOrganization(input, orgAdmin);

      const passed = service.updateOrganization.mock
        .calls[0][1] as UpdateOrganizationInput;
      expect(passed.name).toBe('Renamed School');
      expect(passed.plan).toBeUndefined();
      expect(passed.userLicenseLimit).toBeUndefined();
      expect(passed.billingAmountChf).toBeUndefined();
      expect(passed.lifecycleStatus).toBeUndefined();
      expect(passed.trialEndsAt).toBeUndefined();
      expect(passed.isActive).toBeUndefined();
      expect(passed.isArchived).toBeUndefined();
    });

    it('keeps billing/lifecycle fields for a SuperAdmin', async () => {
      const input = {
        id: OTHER_ORG_ID,
        plan: 'ENTERPRISE',
        lifecycleStatus: 'SUSPENDED',
      } as UpdateOrganizationInput;

      await resolver.updateOrganization(input, superAdmin);

      expect(service.updateOrganization).toHaveBeenCalledWith(
        OTHER_ORG_ID,
        expect.objectContaining({
          plan: 'ENTERPRISE',
          lifecycleStatus: 'SUSPENDED',
        }),
      );
    });

    it('keeps role requirement and auth guards on the mutation', () => {
      const handler = methodOf('updateOrganization');
      const roles: SystemRole[] = Reflect.getMetadata(ROLES_KEY, handler) ?? [];
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];

      expect(roles).toEqual(
        expect.arrayContaining([SystemRole.ORG_OWNER, SystemRole.ORG_ADMIN]),
      );
      expect(guards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
      );
    });
  });

  describe('isOrganizationSubdomainAvailable', () => {
    it('delegates to the service', async () => {
      service.isSubdomainAvailable.mockResolvedValue(true);

      await expect(
        resolver.isOrganizationSubdomainAvailable('acme'),
      ).resolves.toBe(true);
      expect(service.isSubdomainAvailable).toHaveBeenCalledWith('acme');
    });
  });

  describe('isOrganizationDomainAvailable', () => {
    it('delegates to the service', async () => {
      service.isDomainAvailable.mockResolvedValue(false);

      await expect(
        resolver.isOrganizationDomainAvailable('acme.com'),
      ).resolves.toBe(false);
      expect(service.isDomainAvailable).toHaveBeenCalledWith('acme.com');
    });
  });

  describe('removeOrganization', () => {
    it('delegates to the service', async () => {
      const archived = { id: 'org-1', isActive: false, isArchived: true };
      service.removeOrganization.mockResolvedValue(archived);

      await expect(resolver.removeOrganization('org-1')).resolves.toBe(
        archived,
      );
      expect(service.removeOrganization).toHaveBeenCalledWith('org-1');
    });
  });

  describe('SuperAdmin-only operations keep their guards', () => {
    it.each([
      ['createOrganization', methodOf('createOrganization')],
      ['removeOrganization', methodOf('removeOrganization')],
      ['organizationsOverview', methodOf('organizationsOverview')],
      ['organizationUsage', methodOf('organizationUsage')],
      ['suspendOrganization', methodOf('suspendOrganization')],
      ['reactivateOrganization', methodOf('reactivateOrganization')],
      ['changeOrganizationPlan', methodOf('changeOrganizationPlan')],
      ['organizationAuditLog', methodOf('organizationAuditLog')],
      ['exportOrganizationData', methodOf('exportOrganizationData')],
      ['organizationOwner', methodOf('organizationOwner')],
    ])('%s requires SuperAdminGuard', (_name, handler) => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];
      expect(guards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, SuperAdminGuard]),
      );
    });
  });

  describe('organizationsOverview', () => {
    it('delegates to the service', async () => {
      const overview = { stats: {}, rows: [] };
      service.getOrganizationsOverview.mockResolvedValue(overview);

      await expect(resolver.organizationsOverview()).resolves.toBe(overview);
    });
  });

  describe('organizationUsage', () => {
    it('delegates to the service with the given org id', async () => {
      const usage = { userCount: 5 };
      service.getOrganizationUsage.mockResolvedValue(usage);

      await expect(resolver.organizationUsage('org-1')).resolves.toBe(usage);
      expect(service.getOrganizationUsage).toHaveBeenCalledWith('org-1');
    });
  });

  describe('organizationOwner', () => {
    it('delegates to the service with the given org id', async () => {
      const owner = { id: 'user-1', email: 'owner@acme.test' };
      service.getOrganizationOwner.mockResolvedValue(owner);

      await expect(resolver.organizationOwner('org-1')).resolves.toBe(owner);
      expect(service.getOrganizationOwner).toHaveBeenCalledWith('org-1');
    });

    it('returns null when the organization has no owner', async () => {
      service.getOrganizationOwner.mockResolvedValue(null);

      await expect(resolver.organizationOwner('org-1')).resolves.toBeNull();
    });
  });

  describe('suspendOrganization', () => {
    it('passes id, reason and the acting SuperAdmin id to the service', async () => {
      service.suspendOrganization.mockResolvedValue({ id: 'org-1' });

      await resolver.suspendOrganization(
        { id: 'org-1', reason: 'no payment' },
        superAdmin,
      );
      expect(service.suspendOrganization).toHaveBeenCalledWith(
        'org-1',
        'no payment',
        superAdmin.sub,
      );
    });
  });

  describe('reactivateOrganization', () => {
    it('passes id and the acting SuperAdmin id to the service', async () => {
      service.reactivateOrganization.mockResolvedValue({ id: 'org-1' });

      await resolver.reactivateOrganization('org-1', superAdmin);
      expect(service.reactivateOrganization).toHaveBeenCalledWith(
        'org-1',
        superAdmin.sub,
      );
    });
  });

  describe('changeOrganizationPlan', () => {
    it('passes the input and the acting SuperAdmin id to the service', async () => {
      service.changeOrganizationPlan.mockResolvedValue({ id: 'org-1' });
      const input = { id: 'org-1', plan: 'ENTERPRISE' } as never;

      await resolver.changeOrganizationPlan(input, superAdmin);
      expect(service.changeOrganizationPlan).toHaveBeenCalledWith(
        input,
        superAdmin.sub,
      );
    });
  });

  describe('organizationAuditLog', () => {
    it('delegates pagination to the service', async () => {
      const page = { items: [], total: 0 };
      service.getOrganizationAuditLog.mockResolvedValue(page);

      await resolver.organizationAuditLog('org-1', 10, 5);
      expect(service.getOrganizationAuditLog).toHaveBeenCalledWith(
        'org-1',
        10,
        5,
      );
    });
  });

  describe('exportOrganizationData', () => {
    it('passes id and the acting SuperAdmin id to the service', async () => {
      service.exportOrganizationData.mockResolvedValue({
        jobId: 'job-1',
        status: 'QUEUED',
      });

      await resolver.exportOrganizationData('org-1', superAdmin);
      expect(service.exportOrganizationData).toHaveBeenCalledWith(
        'org-1',
        superAdmin.sub,
      );
    });
  });
});
