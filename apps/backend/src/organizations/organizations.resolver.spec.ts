import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationInput } from './dto/update-organization.input';
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

      await expect(resolver.createOrganization()).resolves.toBe(created);
      expect(service.create).toHaveBeenCalledTimes(1);
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
    ])('%s requires SuperAdminGuard', (_name, handler) => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];
      expect(guards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, SuperAdminGuard]),
      );
    });
  });
});
