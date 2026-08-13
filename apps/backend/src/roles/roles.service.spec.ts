import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleFieldPermission } from './entities/role-field-permission.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { PermissionsService } from '@/permissions/permissions.service';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let roleFieldPermissionRepo: {
    find: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let permissionsService: { findByCodes: jest.Mock };
  let membershipRepo: { find: jest.Mock; save: jest.Mock };
  let qb: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getCount: jest.Mock;
  };

  const orgId = 'org-1';

  beforeEach(async () => {
    qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    };

    roleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'role-new', ...x })),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    roleFieldPermissionRepo = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((x) => x),
      save: jest.fn().mockResolvedValue(undefined),
    };

    permissionsService = {
      findByCodes: jest.fn().mockResolvedValue([]),
    };

    membershipRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((x) => Promise.resolve(x)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        {
          provide: getRepositoryToken(RoleFieldPermission),
          useValue: roleFieldPermissionRepo,
        },
        { provide: getRepositoryToken(Membership), useValue: membershipRepo },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('privilege escalation - permission level', () => {
    it('rejects createRole granting a permission the actor lacks', async () => {
      await expect(
        service.createRole(
          orgId,
          { name: 'New Role', permissionCodes: ['ORG_TRANSFER_OWNERSHIP'] },
          ['ADDRESS_READ'],
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(roleRepo.save).not.toHaveBeenCalled();
    });

    it('allows createRole when requested permissions are a subset of actor permissions', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-new',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });

      await expect(
        service.createRole(
          orgId,
          { name: 'New Role', permissionCodes: ['ADDRESS_READ'] },
          ['ADDRESS_READ', 'ADDRESS_WRITE'],
        ),
      ).resolves.toBeDefined();
      expect(roleRepo.save).toHaveBeenCalled();
    });

    it('rejects updateRole granting a permission the actor lacks', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-1',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });

      await expect(
        service.updateRole(
          orgId,
          { id: 'role-1', permissionCodes: ['ORG_TRANSFER_OWNERSHIP'] },
          ['ADDRESS_READ'],
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('privilege escalation - field level', () => {
    it('rejects field-level over-grant beyond actor field permissions', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-1',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });

      const actorFieldPermissions = new Map<string, Set<string>>([
        ['employeeContract.grossSalary', new Set(['read'])],
      ]);

      await expect(
        service.updateRoleFieldPermissions(
          orgId,
          'role-1',
          [
            {
              resource: 'employeeContract',
              field: 'grossSalary',
              actions: ['read', 'update'],
            },
          ],
          actorFieldPermissions,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(roleFieldPermissionRepo.delete).not.toHaveBeenCalled();
    });

    it('allows field grant that is subset of actor field permissions', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-1',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });

      const actorFieldPermissions = new Map<string, Set<string>>([
        ['employeeContract.grossSalary', new Set(['read', 'update'])],
      ]);

      await expect(
        service.updateRoleFieldPermissions(
          orgId,
          'role-1',
          [
            {
              resource: 'employeeContract',
              field: 'grossSalary',
              actions: ['read'],
            },
          ],
          actorFieldPermissions,
        ),
      ).resolves.toBeDefined();
      expect(roleFieldPermissionRepo.delete).toHaveBeenCalledWith({
        roleId: 'role-1',
      });
    });

    it('rejects unknown protected field key', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-1',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });

      await expect(
        service.updateRoleFieldPermissions(
          orgId,
          'role-1',
          [{ resource: 'nope', field: 'nope', actions: ['read'] }],
          new Map(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts the newly-catalogued admissionAuditLog fields as a valid grant', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-1',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });

      const actorFieldPermissions = new Map<string, Set<string>>([
        ['admissionAuditLog.oldValue', new Set(['read'])],
        ['admissionAuditLog.newValue', new Set(['read'])],
      ]);

      await expect(
        service.updateRoleFieldPermissions(
          orgId,
          'role-1',
          [
            {
              resource: 'admissionAuditLog',
              field: 'oldValue',
              actions: ['read'],
            },
            {
              resource: 'admissionAuditLog',
              field: 'newValue',
              actions: ['read'],
            },
          ],
          actorFieldPermissions,
        ),
      ).resolves.toBeDefined();
      expect(roleFieldPermissionRepo.delete).toHaveBeenCalledWith({
        roleId: 'role-1',
      });
    });
  });

  describe('system role identity protection', () => {
    const makeSystemRole = () => ({
      id: 'role-sys',
      organizationId: orgId,
      name: 'Admin',
      description: 'Built-in',
      isSystem: true,
      permissions: [],
    });

    it('forbids renaming a system role', async () => {
      roleRepo.findOne.mockResolvedValue(makeSystemRole());
      await expect(
        service.updateRole(orgId, { id: 'role-sys', name: 'Hacked' }, []),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids changing a system role description', async () => {
      roleRepo.findOne.mockResolvedValue(makeSystemRole());
      await expect(
        service.updateRole(
          orgId,
          { id: 'role-sys', description: 'Changed' },
          [],
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows updating permissions of a system role', async () => {
      const role = makeSystemRole();
      roleRepo.findOne.mockResolvedValue(role);
      roleRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));
      permissionsService.findByCodes.mockResolvedValue([
        { id: 'p-1', code: 'STUDENT_READ' },
      ]);

      await service.updateRole(
        orgId,
        { id: 'role-sys', permissionCodes: ['STUDENT_READ'] },
        ['STUDENT_READ'],
      );

      expect(roleRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'role-sys',
          permissions: [{ id: 'p-1', code: 'STUDENT_READ' }],
        }),
      );
    });

    it('forbids granting permissions the actor lacks (non super admin)', async () => {
      roleRepo.findOne.mockResolvedValue(makeSystemRole());
      await expect(
        service.updateRolePermissions(
          'role-sys',
          ['STUDENT_READ'],
          orgId,
          [],
          false,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets a super admin grant permissions they do not hold themselves', async () => {
      const role = makeSystemRole();
      roleRepo.findOne.mockResolvedValue(role);
      roleRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));
      permissionsService.findByCodes.mockResolvedValue([
        { id: 'p-1', code: 'STUDENT_READ' },
      ]);

      await expect(
        service.updateRolePermissions(
          'role-sys',
          ['STUDENT_READ'],
          orgId,
          [],
          true,
        ),
      ).resolves.toBeDefined();
    });

    it('allows updateRoleFieldPermissions on a system role', async () => {
      roleRepo.findOne.mockResolvedValue(makeSystemRole());

      await expect(
        service.updateRoleFieldPermissions(orgId, 'role-sys', [], new Map()),
      ).resolves.toBeDefined();
    });

    it('forbids deleteRole on a system role', async () => {
      roleRepo.findOne.mockResolvedValue(makeSystemRole());
      await expect(
        service.deleteRole(orgId, 'role-sys'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(roleRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('multi-tenant isolation - field permissions', () => {
    it('rejects updateRoleFieldPermissions for a role belonging to another org', async () => {
      // findOne queries WHERE id AND organizationId - a foreign-org role never
      // matches and TypeORM resolves null, exactly like a missing role.
      roleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateRoleFieldPermissions(
          orgId,
          'role-foreign',
          [
            {
              resource: 'admissionAuditLog',
              field: 'oldValue',
              actions: ['read'],
            },
          ],
          new Map(),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(roleFieldPermissionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('multi-tenant isolation - missing active org', () => {
    // TypeORM's `find`/`findOne` silently drop a `where` key whose value is
    // `undefined` instead of matching IS NULL, so `organizationId: undefined`
    // (a SuperAdmin with no active org) would return roles across every org.
    it('findAllByOrgId returns an empty list instead of leaking all orgs', async () => {
      await expect(
        service.findAllByOrgId(undefined as unknown as string),
      ).resolves.toEqual([]);
      expect(roleRepo.find).not.toHaveBeenCalled();
    });

    it('findOne rejects instead of matching roles across orgs', async () => {
      await expect(
        service.findOne('role-1', undefined as unknown as string),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(roleRepo.findOne).not.toHaveBeenCalled();
    });

    it('createRole rejects when no active org is set', async () => {
      await expect(
        service.createRole(undefined as unknown as string, { name: 'X' }, []),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(roleRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('last-owner-role protection', () => {
    const ownerRole = {
      id: 'role-owner',
      organizationId: orgId,
      isSystem: false,
      permissions: [{ code: PermissionCode.ORG_TRANSFER_OWNERSHIP }],
    };

    it('blocks deleting the last role granting ORG_TRANSFER_OWNERSHIP', async () => {
      roleRepo.findOne.mockResolvedValue(ownerRole);
      qb.getCount.mockResolvedValue(0);

      await expect(
        service.deleteRole(orgId, 'role-owner'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(roleRepo.remove).not.toHaveBeenCalled();
    });

    it('allows deleting an owner role when another role still grants it', async () => {
      roleRepo.findOne.mockResolvedValue(ownerRole);
      qb.getCount.mockResolvedValue(1);

      await expect(service.deleteRole(orgId, 'role-owner')).resolves.toBe(true);
      expect(roleRepo.remove).toHaveBeenCalledWith(ownerRole);
    });

    it('blocks stripping ORG_TRANSFER_OWNERSHIP from the last owner role', async () => {
      roleRepo.findOne.mockResolvedValue(ownerRole);
      qb.getCount.mockResolvedValue(0);

      await expect(
        service.updateRole(
          orgId,
          { id: 'role-owner', permissionCodes: ['ADDRESS_READ'] },
          ['ADDRESS_READ', PermissionCode.ORG_TRANSFER_OWNERSHIP],
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows stripping ORG_TRANSFER_OWNERSHIP when another role still grants it', async () => {
      roleRepo.findOne.mockResolvedValue({
        ...ownerRole,
        permissions: [{ code: PermissionCode.ORG_TRANSFER_OWNERSHIP }],
      });
      qb.getCount.mockResolvedValue(1);

      await expect(
        service.updateRole(
          orgId,
          { id: 'role-owner', permissionCodes: ['ADDRESS_READ'] },
          ['ADDRESS_READ', PermissionCode.ORG_TRANSFER_OWNERSHIP],
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('assignMembers - multi-tenant isolation', () => {
    it('assigns role to in-org memberships without duplicating existing roles', async () => {
      membershipRepo.find.mockResolvedValue([
        { id: 'mem-1', organizationId: orgId, roles: [] },
        { id: 'mem-2', organizationId: orgId, roles: [{ id: 'role-1' }] },
      ]);

      await service.assignMembers(orgId, 'role-1', ['mem-1', 'mem-2']);

      expect(membershipRepo.find).toHaveBeenCalledWith({
        where: { id: expect.anything(), organizationId: orgId },
        relations: ['roles'],
      });
      const saved = membershipRepo.save.mock.calls[0][0];
      expect(saved[0].roles).toEqual([{ id: 'role-1' }]);
      expect(saved[1].roles).toEqual([{ id: 'role-1' }]);
    });

    it('rejects when a membershipId belongs to a foreign org', async () => {
      // find() filters by organizationId, so a foreign-org id is silently
      // dropped - simulate that by returning fewer rows than requested.
      membershipRepo.find.mockResolvedValue([
        { id: 'mem-1', organizationId: orgId, roles: [] },
      ]);

      await expect(
        service.assignMembers(orgId, 'role-1', ['mem-1', 'mem-foreign']),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(membershipRepo.save).not.toHaveBeenCalled();
    });

    it('createRole assigns membershipIds after saving the new role', async () => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-new',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });
      membershipRepo.find.mockResolvedValue([
        { id: 'mem-1', organizationId: orgId, roles: [] },
      ]);

      await service.createRole(
        orgId,
        { name: 'New Role', membershipIds: ['mem-1'] },
        [],
      );

      expect(membershipRepo.save).toHaveBeenCalled();
    });

    it('createRole rejects when a membershipId belongs to a foreign org', async () => {
      membershipRepo.find.mockResolvedValue([]);

      await expect(
        service.createRole(
          orgId,
          { name: 'New Role', membershipIds: ['mem-foreign'] },
          [],
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(roleRepo.save).toHaveBeenCalled();
      expect(membershipRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRoleMembers - multi-tenant isolation', () => {
    beforeEach(() => {
      roleRepo.findOne.mockResolvedValue({
        id: 'role-1',
        organizationId: orgId,
        isSystem: false,
        permissions: [],
      });
    });

    it('adds the role to newly selected members and removes it from deselected ones', async () => {
      membershipRepo.find
        .mockResolvedValueOnce([
          { id: 'mem-2', organizationId: orgId, roles: [] },
        ])
        .mockResolvedValueOnce([
          { id: 'mem-1', organizationId: orgId, roles: [{ id: 'role-1' }] },
          { id: 'mem-2', organizationId: orgId, roles: [] },
        ]);

      await service.updateRoleMembers(orgId, 'role-1', ['mem-2']);

      const saved = membershipRepo.save.mock.calls[0][0];
      const savedMem1 = saved.find((m: { id: string }) => m.id === 'mem-1');
      const savedMem2 = saved.find((m: { id: string }) => m.id === 'mem-2');
      expect(savedMem1.roles).toEqual([]);
      expect(savedMem2.roles).toEqual([{ id: 'role-1' }]);
    });

    it('leaves unrelated memberships untouched', async () => {
      membershipRepo.find
        .mockResolvedValueOnce([
          { id: 'mem-1', organizationId: orgId, roles: [{ id: 'role-1' }] },
        ])
        .mockResolvedValueOnce([
          { id: 'mem-1', organizationId: orgId, roles: [{ id: 'role-1' }] },
          { id: 'mem-3', organizationId: orgId, roles: [{ id: 'role-other' }] },
        ]);

      await service.updateRoleMembers(orgId, 'role-1', ['mem-1']);

      expect(membershipRepo.save).not.toHaveBeenCalled();
    });

    it('rejects when a membershipId belongs to a foreign org', async () => {
      membershipRepo.find.mockResolvedValueOnce([]);

      await expect(
        service.updateRoleMembers(orgId, 'role-1', ['mem-foreign']),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(membershipRepo.save).not.toHaveBeenCalled();
    });
  });
});
