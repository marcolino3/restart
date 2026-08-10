/**
 * Integration tests for RolesService multi-tenant isolation.
 *
 * These tests require a running PostgreSQL test database.
 * Start it with: docker compose -f docker-compose.test.yml up -d
 * Run with: npx jest --config ./test/jest-e2e.json --testPathPatterns=roles.integration
 */
import { DataSource } from 'typeorm';
import { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesService } from '@/roles/roles.service';
import { PermissionsService } from '@/permissions/permissions.service';
import { Role } from '@/roles/entities/role.entity';
import { RoleFieldPermission } from '@/roles/entities/role-field-permission.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';
import { seedPermissionCatalog } from '@/permissions/seeds/permission-catalog.seeder';
import { seedOrgSystemRoles } from '@/roles/seeds/system-roles.seeder';
import { assignPermissionsToOrgSystemRoles } from '@/roles/seeds/assign-permissions-to-system-roles.seeder';
import { createTestingApp, cleanDatabase } from './test-utils';

describe('RolesService multi-tenant isolation (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let rolesService: RolesService;

  beforeAll(async () => {
    const app = await createTestingApp(
      [
        TypeOrmModule.forFeature([
          Role,
          RoleFieldPermission,
          Permission,
          Organization,
        ]),
      ],
      {
        loadAllEntities: true,
        extraProviders: [RolesService, PermissionsService],
      },
    );
    module = app.module;
    dataSource = app.dataSource;
    rolesService = module.get(RolesService);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  async function createOrgWithSeeds(): Promise<string> {
    return dataSource.manager.transaction(async (manager) => {
      const org = await manager.save(
        manager.create(Organization, {
          isActive: false,
          timezone: 'Europe/Berlin',
        }),
      );
      await seedPermissionCatalog(manager);
      await seedOrgSystemRoles(manager, org.id);
      await assignPermissionsToOrgSystemRoles(manager, org.id);
      return org.id;
    });
  }

  it('cannot read a role created in a different organization', async () => {
    const orgAId = await createOrgWithSeeds();
    const orgBId = await createOrgWithSeeds();

    const role = await rolesService.createRole(
      orgAId,
      { name: 'Custom Role A', permissionCodes: [PermissionCode.ADDRESS_READ] },
      [PermissionCode.ADDRESS_READ],
    );

    await expect(rolesService.findOne(role.id, orgBId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('cannot update a role belonging to a different organization', async () => {
    const orgAId = await createOrgWithSeeds();
    const orgBId = await createOrgWithSeeds();

    const role = await rolesService.createRole(
      orgAId,
      { name: 'Custom Role A', permissionCodes: [PermissionCode.ADDRESS_READ] },
      [PermissionCode.ADDRESS_READ],
    );

    await expect(
      rolesService.updateRole(orgBId, { id: role.id, name: 'Hijacked' }, [
        PermissionCode.ADDRESS_READ,
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cannot delete a role belonging to a different organization', async () => {
    const orgAId = await createOrgWithSeeds();
    const orgBId = await createOrgWithSeeds();

    const role = await rolesService.createRole(
      orgAId,
      { name: 'Custom Role A', permissionCodes: [PermissionCode.ADDRESS_READ] },
      [PermissionCode.ADDRESS_READ],
    );

    await expect(
      rolesService.deleteRole(orgBId, role.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cannot set field permissions on a role belonging to a different organization', async () => {
    const orgAId = await createOrgWithSeeds();
    const orgBId = await createOrgWithSeeds();

    const role = await rolesService.createRole(
      orgAId,
      { name: 'Custom Role A', permissionCodes: [] },
      [],
    );

    await expect(
      rolesService.updateRoleFieldPermissions(
        orgBId,
        role.id,
        [
          {
            resource: 'employeeContract',
            field: 'grossSalary',
            actions: ['read'],
          },
        ],
        new Map([['employeeContract.grossSalary', new Set(['read'])]]),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cannot duplicate a role across organizations as a template', async () => {
    const orgAId = await createOrgWithSeeds();
    const orgBId = await createOrgWithSeeds();

    const role = await rolesService.createRole(
      orgAId,
      { name: 'Custom Role A', permissionCodes: [PermissionCode.ADDRESS_READ] },
      [PermissionCode.ADDRESS_READ],
    );

    await expect(
      rolesService.duplicateRole(orgBId, role.id, 'Copied', [
        PermissionCode.ADDRESS_READ,
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('only counts roles within the same org for last-owner-role protection', async () => {
    const orgAId = await createOrgWithSeeds();
    await createOrgWithSeeds();

    const rolesInA = await rolesService.findAllByOrgId(orgAId);
    const ownerRoleA = rolesInA.find((r) =>
      (r.permissions ?? []).some(
        (p) => p.code === PermissionCode.ORG_TRANSFER_OWNERSHIP,
      ),
    );
    expect(ownerRoleA).toBeDefined();

    // Org B's owner role must not shield org A's last owner role from
    // deletion - the count query must be org-scoped.
    await expect(
      rolesService.deleteRole(orgAId, ownerRoleA!.id),
    ).rejects.toThrow();
  });
});
