import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input';
import { UpdateRoleMembersInput } from './dto/update-role-members.input';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

describe('RolesResolver', () => {
  let resolver: RolesResolver;
  let rolesService: {
    findAllByOrgId: jest.Mock;
    updateRolePermissions: jest.Mock;
    updateRole: jest.Mock;
    updateRoleMembers: jest.Mock;
  };

  const orgId = 'org-1';
  const user = {
    permissions: ['ROLE_ASSIGN'],
  } as import('@/auth/interfaces/token-payload.interface').TokenPayload;

  beforeEach(async () => {
    rolesService = {
      findAllByOrgId: jest.fn().mockResolvedValue([]),
      updateRolePermissions: jest.fn().mockResolvedValue({ id: 'role-1' }),
      updateRole: jest.fn().mockResolvedValue({ id: 'role-1' }),
      updateRoleMembers: jest.fn().mockResolvedValue({ id: 'role-1' }),
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
        resolver.updateRolePermissions(input, orgId, user),
      ).resolves.toEqual({ id: 'role-1' });
      expect(rolesService.updateRolePermissions).toHaveBeenCalledWith(
        'role-1',
        ['ADDRESS_READ', 'ADDRESS_WRITE'],
        orgId,
        user.permissions,
        false,
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
        resolver.updateRolePermissions(input, orgId, user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(rolesService.updateRolePermissions).toHaveBeenCalledWith(
        'role-foreign',
        [],
        orgId,
        user.permissions,
        false,
      );
    });
  });

  describe('updateRole', () => {
    it('forwards the super admin flag so escalation checks can be skipped', async () => {
      const superAdmin = {
        permissions: [],
        isSuperAdmin: true,
      } as unknown as import('@/auth/interfaces/token-payload.interface').TokenPayload;
      const input = { id: 'role-1', permissionCodes: ['ADDRESS_READ'] };

      await resolver.updateRole(input, orgId, superAdmin);

      expect(rolesService.updateRole).toHaveBeenCalledWith(
        orgId,
        input,
        [],
        true,
      );
    });

    it('defaults the super admin flag to false for a regular actor', async () => {
      const input = { id: 'role-1', permissionCodes: ['ADDRESS_READ'] };

      await resolver.updateRole(input, orgId, user);

      expect(rolesService.updateRole).toHaveBeenCalledWith(
        orgId,
        input,
        user.permissions,
        false,
      );
    });
  });

  describe('updateRoleMembers', () => {
    it('scopes the member update to the org from the session, not the input', async () => {
      const input: UpdateRoleMembersInput = {
        roleId: 'role-1',
        membershipIds: ['m-1', 'm-2'],
      };

      await expect(resolver.updateRoleMembers(input, orgId)).resolves.toEqual({
        id: 'role-1',
      });
      expect(rolesService.updateRoleMembers).toHaveBeenCalledWith(
        orgId,
        'role-1',
        ['m-1', 'm-2'],
      );
    });

    it('passes an empty list through so all members can be removed', async () => {
      const input: UpdateRoleMembersInput = {
        roleId: 'role-1',
        membershipIds: [],
      };

      await resolver.updateRoleMembers(input, orgId);

      expect(rolesService.updateRoleMembers).toHaveBeenCalledWith(
        orgId,
        'role-1',
        [],
      );
    });

    it('propagates NotFoundException when the role belongs to another org', async () => {
      rolesService.updateRoleMembers.mockRejectedValue(
        new NotFoundException('Role role-foreign not found'),
      );
      const input: UpdateRoleMembersInput = {
        roleId: 'role-foreign',
        membershipIds: ['m-1'],
      };

      await expect(
        resolver.updateRoleMembers(input, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('mutation guards', () => {
    it('keeps updateRoleMembers behind ROLE_ASSIGN', () => {
      // Read the descriptor instead of the method reference: the decorator
      // metadata lives on the same function object, but going through the
      // descriptor keeps the method bound to its prototype.
      const descriptor = Object.getOwnPropertyDescriptor(
        RolesResolver.prototype,
        'updateRoleMembers',
      );
      const permissions = Reflect.getMetadata(PERMS_KEY, descriptor!.value);
      expect(permissions).toEqual(['ROLE_ASSIGN']);
    });
  });
});
