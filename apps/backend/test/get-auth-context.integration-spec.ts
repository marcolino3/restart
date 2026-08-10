/**
 * Integration tests for getAuthContext — field-level RBAC multi-tenant isolation.
 *
 * These tests require a running PostgreSQL test database.
 * Start it with: docker compose -f docker-compose.test.yml up -d
 * Run with: npx jest --config ./test/jest-e2e.json --testPathPatterns=get-auth-context.integration
 */
import { DataSource } from 'typeorm';
import { TestingModule } from '@nestjs/testing';

import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Persona } from '@/common/enums/persona.enum';
import { Role } from '@/roles/entities/role.entity';
import { RoleFieldPermission } from '@/roles/entities/role-field-permission.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';
import { getAuthContext } from '@/auth/utils/get-auth-context.util';
import { createTestingApp, cleanDatabase } from './test-utils';

describe('getAuthContext (Integration) — field permission isolation', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    const app = await createTestingApp([], { loadAllEntities: true });
    module = app.module;
    dataSource = app.dataSource;
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  it('does not leak field permissions from a role in a foreign org', async () => {
    const orgRepo = dataSource.getRepository(Organization);
    const userRepo = dataSource.getRepository(User);
    const membershipRepo = dataSource.getRepository(Membership);
    const roleRepo = dataSource.getRepository(Role);
    const fieldPermRepo = dataSource.getRepository(RoleFieldPermission);
    const permissionRepo = dataSource.getRepository(Permission);

    const orgA = await orgRepo.save(orgRepo.create({ isActive: true }));
    const orgB = await orgRepo.save(orgRepo.create({ isActive: true }));

    const user = await userRepo.save(
      userRepo.create({ firstName: 'Test', lastName: 'User' }),
    );

    const roleA = await roleRepo.save(
      roleRepo.create({
        organizationId: orgA.id,
        name: 'Foreign Role',
        isSystem: false,
      }),
    );
    const roleB = await roleRepo.save(
      roleRepo.create({
        organizationId: orgB.id,
        name: 'Own Role',
        isSystem: false,
      }),
    );

    // Foreign org grants "update" on iban — must never surface for orgB context.
    await fieldPermRepo.save(
      fieldPermRepo.create({
        roleId: roleA.id,
        resource: 'employeeHrProfile',
        field: 'iban',
        actions: ['update'],
      }),
    );
    // Own org only grants "read" on iban.
    await fieldPermRepo.save(
      fieldPermRepo.create({
        roleId: roleB.id,
        resource: 'employeeHrProfile',
        field: 'iban',
        actions: ['read'],
      }),
    );

    // Same cross-org check for the org-scoped permission cache
    // (role-permission-cache.ts): orgA's role gets a permission orgB's
    // role does not have — must never surface in orgB's context.
    const permission = await permissionRepo.save(
      permissionRepo.create({
        name: 'Transfer Ownership',
        code: PermissionCode.ORG_TRANSFER_OWNERSHIP,
      }),
    );
    await dataSource
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(roleA)
      .add(permission);

    const membershipA = await membershipRepo.save(
      membershipRepo.create({
        userId: user.id,
        organizationId: orgA.id,
        persona: Persona.EMPLOYEE,
      }),
    );
    await dataSource
      .createQueryBuilder()
      .relation(Membership, 'roles')
      .of(membershipA)
      .add(roleA);

    const membershipB = await membershipRepo.save(
      membershipRepo.create({
        userId: user.id,
        organizationId: orgB.id,
        persona: Persona.EMPLOYEE,
      }),
    );
    await dataSource
      .createQueryBuilder()
      .relation(Membership, 'roles')
      .of(membershipB)
      .add(roleB);

    const ctx = await getAuthContext(dataSource.manager, user.id, orgB.id);

    const key = 'employeeHrProfile.iban';
    expect(ctx.fieldPermissions.get(key)?.has('read')).toBe(true);
    expect(ctx.fieldPermissions.get(key)?.has('update')).toBe(false);
    expect(ctx.roles.map((r) => r.id)).toEqual([roleB.id]);
    expect(ctx.permissions).not.toContain(
      PermissionCode.ORG_TRANSFER_OWNERSHIP,
    );
  });
});
