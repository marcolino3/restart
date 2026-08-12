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
import { Membership } from '@/memberships/entities/membership.entity';
import { User } from '@/users/entities/user.entity';
import { Persona } from '@/common/enums/persona.enum';
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
          Membership,
          User,
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

  it('loads roles with nested memberships.user relations without a query-builder error', async () => {
    // Regression test: Membership.roles was missing the inverse-side function
    // argument, so TypeORM never linked it to Role.memberships as the same
    // relation. Loading `relations: ['memberships', 'memberships.user']` from
    // the Role side then failed deep inside SelectQueryBuilder with
    // "Cannot read properties of undefined (reading 'tablePath')" as soon as
    // a role actually had a membership to join against.
    const orgId = await createOrgWithSeeds();

    const role = await rolesService.createRole(
      orgId,
      { name: 'Custom Role A', permissionCodes: [PermissionCode.ADDRESS_READ] },
      [PermissionCode.ADDRESS_READ],
    );

    const user = await dataSource.manager.save(
      dataSource.manager.create(User, {
        email: 'roles-integration@example.com',
        firstName: 'Roles',
        lastName: 'Integration',
        isSuperAdmin: false,
      }),
    );
    await dataSource.manager.save(
      dataSource.manager.create(Membership, {
        organizationId: orgId,
        userId: user.id,
        persona: Persona.EMPLOYEE,
        roles: [role],
      }),
    );

    const roles = await rolesService.findAllByOrgId(orgId);
    const loaded = roles.find((r) => r.id === role.id);

    expect(loaded?.memberships).toHaveLength(1);
    expect(loaded?.memberships?.[0].user?.id).toBe(user.id);
  });
});
