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
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

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
  let service: { updateOrganization: jest.Mock };

  beforeEach(async () => {
    service = { updateOrganization: jest.fn().mockResolvedValue({}) };

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

  describe('updateOrganization (regression: cross-tenant write was possible)', () => {
    const makeInput = (id: string) =>
      ({ id, name: 'Evil Corp' }) as UpdateOrganizationInput;

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
