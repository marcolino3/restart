import { EmployeesService } from '@/employee-management/employees/employees.service';
import { EmployeeAuditLogService } from '@/employee-management/employee-audit-log/employee-audit-log.service';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { DataSource } from 'typeorm';
import { TestingModule } from '@nestjs/testing';
import { createTestingApp, cleanDatabase } from './test-utils';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { PermissionCode } from '@/permissions/entities/permission-code.enum';
import { Persona } from '@/common/enums/persona.enum';
import { assignMembershipRoles } from '@/roles/membership-role-assignment';
import { MembershipsService } from '@/memberships/memberships.service';
import { EmployeeOrganizationProfiles1789040000000 } from '@/migrations/1789040000000-EmployeeOrganizationProfiles';
import { EmployeeAuditLog } from '@/employee-management/employee-audit-log/entities/employee-audit-log.entity';
import { randomUUID } from 'node:crypto';
import { RolesService } from '@/roles/roles.service';
import { RoleFieldPermission } from '@/roles/entities/role-field-permission.entity';
import { PermissionsService } from '@/permissions/permissions.service';
import { EmployeeStorageCleanup } from '@/employee-management/employees/entities/employee-storage-cleanup.entity';

describe('employee security with PostgreSQL constraints and locks', () => {
  let module: TestingModule;
  let db: DataSource;
  let org: Organization;
  let other: Organization;
  let members: Membership[];
  let owner: Role;
  beforeAll(async () => {
    ({ module, dataSource: db } = await createTestingApp([], {
      loadAllEntities: true,
    }));
  });
  afterAll(async () => {
    await module?.close();
  });
  beforeEach(async () => {
    await cleanDatabase(db);
    org = await db.manager.save(Organization, {
      name: 'Test A',
      subdomain: 'employee-a',
    });
    other = await db.manager.save(Organization, {
      name: 'Test B',
      subdomain: 'employee-b',
    });
    const permission = await db.manager.save(Permission, {
      name: 'Test ownership',
      code: PermissionCode.ORG_TRANSFER_OWNERSHIP,
      description: 'Test ownership',
    });
    owner = await db.manager.save(Role, {
      organizationId: org.id,
      name: 'Test owner',
      isSystem: false,
      permissions: [permission],
    });
    members = [];
    for (const firstName of ['One', 'Two']) {
      const user = await db.manager.save(User, { firstName, lastName: 'Test' });
      members.push(
        await db.manager.save(Membership, {
          organizationId: org.id,
          userId: user.id,
          persona: Persona.EMPLOYEE,
          roles: [owner],
        }),
      );
    }
  });
  it('serializes two owner removals so exactly one owner survives', async () => {
    const results = await Promise.allSettled(
      members.map((membership) =>
        db.transaction((manager) =>
          assignMembershipRoles(manager, membership, [], org.id, {
            sub: membership.userId!,
            orgId: org.id,
            isSuperAdmin: true,
          }),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const persisted = await db.manager.find(Membership, {
      where: { organizationId: org.id },
      relations: ['roles'],
    });
    expect(
      persisted.filter((m) => m.roles?.some((r) => r.id === owner.id)),
    ).toHaveLength(1);
  });
  it('cannot grant owner permissions with employee write alone', async () => {
    await expect(
      db.transaction((manager) =>
        assignMembershipRoles(manager, members[0], [], org.id, {
          sub: members[0].userId!,
          orgId: org.id,
          permissions: ['EMPLOYEE_WRITE'],
        }),
      ),
    ).rejects.toThrow('ROLE_ASSIGN');
    const unchanged = await db.manager.findOneOrFail(Membership, {
      where: { id: members[0].id },
      relations: ['roles'],
    });
    expect(unchanged.roles?.map((r) => r.id)).toEqual([owner.id]);
  });
  const rolesService = () =>
    new RolesService(
      db.getRepository(Role),
      db.getRepository(RoleFieldPermission),
      db.getRepository(Membership),
      new PermissionsService(db.getRepository(Permission)),
    );
  it('serializes concurrent role-definition changes so an active owner survives', async () => {
    const secondRole = await db.manager.save(Role, {
      organizationId: org.id,
      name: 'Second owner',
      permissions: owner.permissions,
    });
    await db.manager.save(Membership, {
      id: members[1].id,
      roles: [secondRole],
    });
    const results = await Promise.allSettled(
      [owner, secondRole].map((role) =>
        rolesService().updateRolePermissions(role.id, [], org.id, [], true),
      ),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const persisted = await db.manager.find(Membership, {
      where: { organizationId: org.id },
      relations: ['roles', 'roles.permissions'],
    });
    expect(
      persisted.filter((membership) =>
        membership.roles?.some((role) =>
          role.permissions?.some(
            (permission) =>
              permission.code === PermissionCode.ORG_TRANSFER_OWNERSHIP,
          ),
        ),
      ),
    ).toHaveLength(1);
  });
  it('does not count an unassigned owner role as a surviving owner', async () => {
    await db.manager.save(Role, {
      organizationId: org.id,
      name: 'Unassigned owner',
      permissions: owner.permissions,
    });
    await expect(rolesService().deleteRole(org.id, owner.id)).rejects.toThrow(
      'last role',
    );
    expect(await db.manager.countBy(Role, { id: owner.id })).toBe(1);
  });
  it('scopes actual membership writes and persists NULL on clear', async () => {
    const service = new MembershipsService(db.getRepository(Membership));
    await expect(
      service.update({ id: members[0].id, contactPhone: 'stolen' }, other.id),
    ).rejects.toThrow('Membership not found');
    await service.update(
      { id: members[0].id, contactPhone: '+41790000000' },
      org.id,
    );
    await service.update({ id: members[0].id, contactPhone: null }, org.id);
    const reloaded = await db.manager.findOneByOrFail(Membership, {
      id: members[0].id,
    });
    expect(reloaded.contactPhone).toBeNull();
    expect(reloaded.organizationId).toBe(org.id);
    expect(reloaded.userId).toBe(members[0].userId);
  });
  const employees = () =>
    new EmployeesService(
      db.manager,
      {} as never,
      new EmployeeAuditLogService(db.manager),
      {} as never,
      db.getRepository(Employee),
    );
  it('matches login email literally, including underscores and percent signs', async () => {
    const service = new UserEmailsService(
      db.getRepository(UserEmail),
      db.manager,
    );
    await db.manager.save(UserEmail, {
      userId: members[0].userId!,
      email: 'annaXtest@example.test',
    });
    await expect(service.findByEmail('anna_test@example.test')).rejects.toThrow(
      'Email not found',
    );
    await expect(service.findByEmail('anna%test@example.test')).rejects.toThrow(
      'Email not found',
    );
    const exact = await service.create(
      members[1].userId!,
      'anna_test@example.test',
    );
    expect((await service.findByEmail(' ANNA_TEST@EXAMPLE.TEST ')).id).toBe(
      exact.id,
    );
    await db.manager.save(UserEmail, {
      userId: members[0].userId!,
      email: 'ANNA_TEST@example.test',
    });
    await expect(service.findByEmail('anna_test@example.test')).rejects.toThrow(
      'Email not found',
    );
  });
  it('keeps same-email organization profiles independent and never auto-links a global account', async () => {
    await db.manager.save(UserEmail, {
      userId: members[0].userId!,
      email: 'existing@example.test',
      isPrimary: true,
    });
    const service = employees();
    const first = await service.upsertEmployeeOnboardingDraft(
      { firstName: 'Org A', lastName: 'Name', email: 'existing@example.test' },
      org.id,
    );
    const second = await service.upsertEmployeeOnboardingDraft(
      { firstName: 'Org B', lastName: 'Name', email: 'existing@example.test' },
      other.id,
    );
    expect(first.membership.userId).toBeNull();
    expect(first.membership.isActive).toBe(false);
    expect(first.accountLinkStatus).toBe('UNLINKED');
    const saved = await service.upsertEmployeeOnboardingDraft(
      {
        id: first.id,
        expectedVersion: first.version,
        firstName: 'Changed A',
        lastName: 'Name',
        street: 'Test street',
      },
      org.id,
    );
    const cleared = await service.upsertEmployeeOnboardingDraft(
      {
        id: first.id,
        expectedVersion: saved.version,
        firstName: 'Changed A',
        lastName: 'Name',
        street: null as never,
      },
      org.id,
    );
    expect(cleared.profile.street).toBeNull();
    expect(
      (await service.findEmployeeById(second.id, other.id)).profile.firstName,
    ).toBe('Org B');
    expect(
      (await db.manager.findOneByOrFail(User, { id: members[0].userId! }))
        .firstName,
    ).toBe('One');
  });
  it('rejects a stale concurrent profile save with no lost update', async () => {
    const service = employees();
    const draft = await service.upsertEmployeeOnboardingDraft(
      { firstName: 'Anna', lastName: 'Test', email: 'anna@example.test' },
      org.id,
    );
    const results = await Promise.allSettled(
      ['One', 'Two'].map((firstName) =>
        service.upsertEmployeeOnboardingDraft(
          {
            id: draft.id,
            expectedVersion: draft.version,
            firstName,
            lastName: 'Test',
          },
          org.id,
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });
  it('rolls a profile update back when the audit cannot be persisted', async () => {
    const service = employees();
    const draft = await service.upsertEmployeeOnboardingDraft(
      { firstName: 'Anna', lastName: 'Test', email: 'anna@example.test' },
      org.id,
    );
    const failing = new EmployeesService(
      db.manager,
      {} as never,
      {
        logChanges: () => Promise.reject(new Error('audit unavailable')),
      } as never,
      {} as never,
      db.getRepository(Employee),
    );
    await expect(
      failing.upsertEmployeeOnboardingDraft(
        {
          id: draft.id,
          expectedVersion: draft.version,
          firstName: 'Lost',
          lastName: 'Test',
        },
        org.id,
      ),
    ).rejects.toThrow('audit unavailable');
    expect(
      (await service.findEmployeeById(draft.id, org.id)).profile.firstName,
    ).toBe('Anna');
  });

  it('preserves roles, logs normalized changes once and deletes only an unlinked draft', async () => {
    const service = employees();
    const draft = await service.upsertEmployeeOnboardingDraft(
      { firstName: 'Anna', lastName: 'Test', email: 'draft@example.test' },
      org.id,
    );
    await db.manager.save(Membership, {
      id: draft.membership.id,
      roles: [owner],
    });
    const changed = await service.upsertEmployeeOnboardingDraft(
      {
        id: draft.id,
        expectedVersion: draft.version,
        firstName: 'Anna',
        lastName: 'Test',
        street: '  Test road  ',
        dateOfBirth: '2000-02-29',
      },
      org.id,
      { sub: members[0].userId!, orgId: org.id, membershipId: members[0].id },
    );
    expect(changed.profile.street).toBe('Test road');
    expect(changed.profile.dateOfBirth).toBe('2000-02-29');
    expect(changed.membership.roles?.map((role) => role.id)).toEqual([
      owner.id,
    ]);
    const logs = await db.manager.find(EmployeeAuditLog, {
      where: { employeeId: draft.id },
    });
    expect(logs).toHaveLength(2);
    expect(
      logs.every(
        (log) =>
          log.actorMembershipId === members[0].id &&
          String(log.entityType) === 'EMPLOYEE',
      ),
    ).toBe(true);
    await service.upsertEmployeeOnboardingDraft(
      {
        id: draft.id,
        expectedVersion: changed.version,
        firstName: 'Anna',
        lastName: 'Test',
        street: 'Test road',
        dateOfBirth: '2000-02-29',
      },
      org.id,
    );
    expect(
      await db.manager.countBy(EmployeeAuditLog, { employeeId: draft.id }),
    ).toBe(2);
    await service.removeEmployeeOnboardingDraft(draft.id, org.id);
    expect(
      await db.manager.findOneBy(EmployeeStorageCleanup, {
        employeeId: draft.id,
      }),
    ).toMatchObject({ organizationId: org.id });
    expect(await db.manager.countBy(Employee, { id: draft.id })).toBe(0);
    expect(
      await db.manager.countBy(Membership, { id: draft.membership.id }),
    ).toBe(0);
    expect(await db.manager.count(User)).toBe(2);
    expect(await db.manager.count(Membership)).toBe(2);
  });

  it('does not delete a linked legacy draft or another organization employee', async () => {
    const service = employees();
    const draft = await service.upsertEmployeeOnboardingDraft(
      { firstName: 'Anna', lastName: 'Test', email: 'draft@example.test' },
      org.id,
    );
    await expect(
      service.removeEmployeeOnboardingDraft(draft.id, other.id),
    ).rejects.toThrow('Employee not found');
    await db.manager.update(
      Employee,
      { id: draft.id },
      { accountLinkStatus: 'LEGACY' },
    );
    await expect(
      service.removeEmployeeOnboardingDraft(draft.id, org.id),
    ).rejects.toThrow('uninvited');
    expect(await db.manager.countBy(Employee, { id: draft.id })).toBe(1);
  });

  // Execute the actual additive migration against the pre-change table shape.
  // A transaction-local schema keeps this independent of synchronize's model.
  it.each([false, true])(
    'migrates a legacy schema (seeded=%s), including shared identity and selected email',
    async (seeded) => {
      const runner = db.createQueryRunner();
      await runner.connect();
      await runner.startTransaction();
      const schema = `employee_migration_${randomUUID().replaceAll('-', '')}`;
      try {
        await runner.query(`CREATE SCHEMA "${schema}"`);
        await runner.query(`SET LOCAL search_path TO "${schema}", public`);
        await runner.query('CREATE TABLE organizations (id uuid PRIMARY KEY)');
        await runner.query(
          'CREATE TABLE users (LIKE public.users INCLUDING ALL)',
        );
        await runner.query(
          'CREATE TABLE user_emails (id uuid PRIMARY KEY, user_id uuid, email varchar(320))',
        );
        await runner.query('CREATE TABLE employees (id uuid PRIMARY KEY)');
        await runner.query(
          'CREATE TABLE memberships (id uuid PRIMARY KEY, organization_id uuid NOT NULL, user_id uuid NOT NULL, employee_id uuid, user_email_id uuid)',
        );
        if (seeded) {
          await runner.query('INSERT INTO organizations(id) VALUES ($1),($2)', [
            org.id,
            other.id,
          ]);
          await runner.query(
            'INSERT INTO users SELECT * FROM public.users WHERE id=$1',
            [members[0].userId],
          );
          const emailId = randomUUID(),
            employeeA = randomUUID(),
            employeeB = randomUUID();
          await runner.query(
            'INSERT INTO user_emails VALUES ($1,$2,$3),($4,$2,$5)',
            [
              emailId,
              members[0].userId,
              ' Selected@Example.Test ',
              randomUUID(),
              'unselected@example.test',
            ],
          );
          await runner.query('INSERT INTO employees VALUES ($1),($2)', [
            employeeA,
            employeeB,
          ]);
          await runner.query(
            'INSERT INTO memberships VALUES ($1,$2,$3,$4,$5),($6,$7,$3,$8,$5)',
            [
              randomUUID(),
              org.id,
              members[0].userId,
              employeeA,
              emailId,
              randomUUID(),
              other.id,
              employeeB,
            ],
          );
        }
        await new EmployeeOrganizationProfiles1789040000000().up(runner);
        const rows = await runner.query(
          'SELECT organization_id, account_link_status, profile_first_name, profile_email FROM employees ORDER BY organization_id',
        );
        expect(rows).toHaveLength(seeded ? 2 : 0);
        if (seeded) {
          expect(
            rows.every(
              (row: Record<string, string>) =>
                row.account_link_status === 'LEGACY' &&
                row.profile_first_name === 'One' &&
                row.profile_email === 'selected@example.test',
            ),
          ).toBe(true);
          expect(
            new Set(
              rows.map((row: Record<string, string>) => row.organization_id),
            ),
          ).toEqual(new Set([org.id, other.id]));
          expect(
            (await runner.query('SELECT first_name FROM users'))[0].first_name,
          ).toBe('One');
          await expect(
            runner.query(
              'UPDATE memberships SET organization_id=$1, user_id=NULL WHERE organization_id=$2',
              [other.id, org.id],
            ),
          ).rejects.toMatchObject({
            driverError: {
              code: '23503',
              constraint: 'fk_membership_employee_org',
            },
          });
        } else {
          const columns = await runner.query(
            "SELECT is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name='memberships' AND column_name='user_id'",
            [schema],
          );
          expect(columns[0].is_nullable).toBe('YES');
        }
      } finally {
        await runner.rollbackTransaction();
        await runner.release();
      }
    },
  );
});
