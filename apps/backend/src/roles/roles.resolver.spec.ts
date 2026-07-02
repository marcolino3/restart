import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input';

describe('RolesResolver', () => {
  let resolver: RolesResolver;
  let rolesService: {
    findAllByOrgId: jest.Mock;
    updateRolePermissions: jest.Mock;
  };

  const orgId = 'org-1';

  beforeEach(async () => {
    rolesService = {
      findAllByOrgId: jest.fn().mockResolvedValue([]),
      updateRolePermissions: jest.fn().mockResolvedValue({ id: 'role-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesResolver,
        { provide: RolesService, useValue: rolesService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<RolesResolver>(RolesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('rolesByOrgId', () => {
    it('queries roles scoped to the current org from the session', async () => {
      const roles = [{ id: 'role-1' }, { id: 'role-2' }];
      rolesService.findAllByOrgId.mockResolvedValue(roles);

      await expect(resolver.rolesByOrgId(orgId)).resolves.toEqual(roles);
      expect(rolesService.findAllByOrgId).toHaveBeenCalledWith(orgId);
    });
  });

  describe('rolesByOrganizationId (SuperAdmin only)', () => {
    it('delegates to the service with the explicitly requested org', async () => {
      await resolver.rolesByOrganizationId('org-other');
      expect(rolesService.findAllByOrgId).toHaveBeenCalledWith('org-other');
    });
  });

  describe('updateRolePermissions', () => {
    it('updates permissions scoped to the current org', async () => {
      const input: UpdateRolePermissionsInput = {
        roleId: 'role-1',
        permissionCodes: ['ADDRESS_READ', 'ADDRESS_WRITE'],
      };

      await expect(
        resolver.updateRolePermissions(input, orgId),
      ).resolves.toEqual({ id: 'role-1' });
      expect(rolesService.updateRolePermissions).toHaveBeenCalledWith(
        'role-1',
        ['ADDRESS_READ', 'ADDRESS_WRITE'],
        orgId,
      );
    });

    it('propagates NotFoundException when the role belongs to another org', async () => {
      rolesService.updateRolePermissions.mockRejectedValue(
        new NotFoundException('Role role-foreign not found in org'),
      );
      const input: UpdateRolePermissionsInput = {
        roleId: 'role-foreign',
        permissionCodes: [],
      };

      await expect(
        resolver.updateRolePermissions(input, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(rolesService.updateRolePermissions).toHaveBeenCalledWith(
        'role-foreign',
        [],
        orgId,
      );
    });
  });
});
