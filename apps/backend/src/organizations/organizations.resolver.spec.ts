import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

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

  const regularUser: TokenPayload = {
    sub: 'user-1',
    orgId: 'org-1',
    isSuperAdmin: false,
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

  describe('updateOrganization', () => {
    it('delegates with the id taken from the input', async () => {
      const input = { id: 'org-1', name: 'Renamed' };
      const updated = { id: 'org-1', name: 'Renamed' };
      service.updateOrganization.mockResolvedValue(updated);

      await expect(resolver.updateOrganization(input)).resolves.toBe(updated);
      expect(service.updateOrganization).toHaveBeenCalledWith('org-1', input);
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
});
