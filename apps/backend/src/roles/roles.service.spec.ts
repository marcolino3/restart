import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleFieldPermission } from './entities/role-field-permission.entity';
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        {
          provide: getRepositoryToken(RoleFieldPermission),
          useValue: roleFieldPermissionRepo,
        },
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

  describe('system role immutability', () => {
    const systemRole = {
      id: 'role-sys',
      organizationId: orgId,
      isSystem: true,
      permissions: [],
    };

    it('forbids updateRole on a system role', async () => {
      roleRepo.findOne.mockResolvedValue(systemRole);
      await expect(
        service.updateRole(orgId, { id: 'role-sys', name: 'Hacked' }, []),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids updateRoleFieldPermissions on a system role', async () => {
      roleRepo.findOne.mockResolvedValue(systemRole);
      await expect(
        service.updateRoleFieldPermissions(orgId, 'role-sys', [], new Map()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids deleteRole on a system role', async () => {
      roleRepo.findOne.mockResolvedValue(systemRole);
      await expect(
        service.deleteRole(orgId, 'role-sys'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(roleRepo.remove).not.toHaveBeenCalled();
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
});
