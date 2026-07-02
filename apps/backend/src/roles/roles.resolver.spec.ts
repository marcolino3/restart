import { Test, TestingModule } from '@nestjs/testing';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { SUPER_ADMIN_KEY } from '@/auth/decorators/super-admin.decorator';
import {
  guardsOf,
  methodOf,
  overrideAllAuthGuards,
  TEST_ORG_ID,
  TEST_OTHER_ORG_ID,
} from '@/common/testing/auth-test.util';

describe('RolesResolver', () => {
  let resolver: RolesResolver;
  let rolesService: {
    findAllByOrgId: jest.Mock;
    updateRolePermissions: jest.Mock;
  };

  beforeEach(async () => {
    rolesService = {
      findAllByOrgId: jest.fn().mockResolvedValue([]),
      updateRolePermissions: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          RolesResolver,
          { provide: RolesService, useValue: rolesService },
        ],
      }),
    ).compile();

    resolver = module.get<RolesResolver>(RolesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('keeps the resolver behind the auth + access guards', () => {
    expect(guardsOf(RolesResolver)).toHaveLength(2);
  });

  it('restricts the cross-org query to super admins', () => {
    const superAdminOnly = Reflect.getMetadata(
      SUPER_ADMIN_KEY,
      methodOf(RolesResolver, 'rolesByOrganizationId'),
    ) as boolean | undefined;
    expect(superAdminOnly).toBe(true);
  });

  it('gates permission updates with ROLE_ASSIGN', () => {
    const perms = Reflect.getMetadata(
      PERMS_KEY,
      methodOf(RolesResolver, 'updateRolePermissions'),
    ) as string[] | undefined;
    expect(perms).toEqual(['ROLE_ASSIGN']);
  });

  describe('delegation', () => {
    it('rolesByOrgId scopes to the current org', async () => {
      await resolver.rolesByOrgId(TEST_ORG_ID);
      expect(rolesService.findAllByOrgId).toHaveBeenCalledWith(TEST_ORG_ID);
    });

    it('rolesByOrganizationId uses the explicit (super-admin) org argument', async () => {
      await resolver.rolesByOrganizationId(TEST_OTHER_ORG_ID);
      expect(rolesService.findAllByOrgId).toHaveBeenCalledWith(
        TEST_OTHER_ORG_ID,
      );
    });

    it('updateRolePermissions passes the current org id through to the service', async () => {
      const input: UpdateRolePermissionsInput = {
        roleId: 'role-1',
        permissionCodes: ['ADDRESS_READ'],
      };
      await resolver.updateRolePermissions(input, TEST_ORG_ID);
      expect(rolesService.updateRolePermissions).toHaveBeenCalledWith(
        'role-1',
        ['ADDRESS_READ'],
        TEST_ORG_ID,
      );
    });
  });
});
