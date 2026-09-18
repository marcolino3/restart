import { EntityManager } from 'typeorm';
import { EmployeesService } from './employees.service';
import {
  Employee,
  EmployeeStatus,
  EmployeeInvitationStatus,
} from './entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { EmployeeContract } from '../employee-contracts/entities/employee-contract.entity';

describe('employee organization profiles', () => {
  let employee: Employee;
  let membership: Membership;
  const audit = { logChanges: jest.fn() };
  const manager = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const repo = { find: jest.fn(), findOne: jest.fn() };
  const service = new EmployeesService(
    {
      transaction: (fn: (m: unknown) => unknown) => fn(manager),
    } as unknown as EntityManager,
    {} as never,
    audit as never,
    {} as never,
    repo as never,
  );
  const patch = (values: Record<string, unknown> = {}) =>
    service.upsertEmployeeOnboardingDraft(
      {
        id: 'employee',
        expectedVersion: 1,
        firstName: 'Anna',
        lastName: 'Test',
        ...values,
      },
      'org',
      { sub: 'actor', orgId: 'org', membershipId: 'actor-member' },
    );
  beforeEach(() => {
    jest.clearAllMocks();
    employee = {
      id: 'employee',
      organizationId: 'org',
      version: 1,
      profile: {
        firstName: 'Anna',
        lastName: 'Test',
        email: 'anna@example.test',
      },
      accountLinkStatus: 'UNLINKED',
      status: EmployeeStatus.DRAFT,
      invitationStatus: EmployeeInvitationStatus.PENDING,
    } as Employee;
    membership = {
      id: 'member',
      employeeId: 'employee',
      organizationId: 'org',
      userId: null,
      isActive: false,
      roles: [],
    } as unknown as Membership;
    manager.findOne.mockImplementation((entity, opts) =>
      Promise.resolve(
        entity === Organization
          ? { id: 'org' }
          : entity === Employee
            ? opts.where.profile
              ? null
              : employee
            : entity === Membership
              ? membership
              : null,
      ),
    );
    manager.findOneOrFail.mockImplementation((entity) =>
      Promise.resolve(entity === Membership ? membership : employee),
    );
    manager.create.mockImplementation((_entity, value) => value);
    manager.save.mockImplementation((_entity, value) =>
      Promise.resolve({ id: 'employee', ...value }),
    );
    manager.find.mockResolvedValue([]);
    manager.update.mockResolvedValue({ affected: 1 });
    repo.find.mockResolvedValue([]);
    repo.findOne.mockImplementation(() =>
      Promise.resolve({ ...employee, membership }),
    );
  });
  it('writes the org profile and audit with the session actor, never global account data', async () => {
    await patch({ firstName: 'Updated' });
    expect(employee.profile.firstName).toBe('Updated');
    expect(employee.version).toBe(2);
    expect(audit.logChanges).toHaveBeenCalledWith(
      'employee',
      'org',
      'actor-member',
      [
        expect.objectContaining({
          fieldName: 'firstName',
          oldValue: 'Anna',
          newValue: 'Updated',
        }),
      ],
      manager,
    );
    expect(
      manager.save.mock.calls.some(
        ([entity]) => entity === User || entity === UserEmail,
      ),
    ).toBe(false);
  });

  describe('directory and legacy endpoints', () => {
    it.each(['list', 'teacher', 'detail'])(
      'rejects missing organization before %s access',
      async (kind) => {
        const result =
          kind === 'list'
            ? service.findEmployeesByOrgId('')
            : kind === 'teacher'
              ? service.findTeachersByOrgId('')
              : service.findEmployeeById('employee', '');
        await expect(result).rejects.toThrow('No active organization');
        expect(repo.find).not.toHaveBeenCalled();
        expect(repo.findOne).not.toHaveBeenCalled();
      },
    );
    it('scopes list rows directly to the organization, including unlinked employees', async () => {
      repo.find.mockResolvedValue([{ ...employee, membership }]);
      const rows = await service.findEmployeesByOrgId('org');
      expect(rows[0].membership.userId).toBeNull();
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org' } }),
      );
    });
    it.each([null, { organizationId: 'other' }])(
      'does not return missing or foreign detail rows',
      async (value) => {
        repo.findOne.mockResolvedValue(value);
        await expect(
          service.findEmployeeById('employee', 'org'),
        ).rejects.toThrow('Employee not found');
      },
    );
    it('returns only teacher directory fields and never global private data', async () => {
      repo.find.mockResolvedValue([
        {
          ...employee,
          profile: {
            firstName: 'Local',
            lastName: 'Teacher',
            privateEmail: 'secret@example.test',
          },
          membership: {
            user: {
              id: 'account',
              firstName: 'Global',
              socialSecurityNumber: 'secret',
            },
          },
        },
        { ...employee, profile: {}, membership: { user: null } },
      ]);
      await expect(service.findTeachersByOrgId('org')).resolves.toEqual([
        {
          id: 'employee',
          firstName: 'Local',
          lastName: 'Teacher',
          userId: 'account',
        },
        { id: 'employee', firstName: '', lastName: '', userId: null },
      ]);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org',
            isActive: true,
            status: EmployeeStatus.ACTIVE,
          }),
        }),
      );
    });
    it('rejects clearing a mandatory name through the minimal update endpoint', async () => {
      await expect(
        service.updateEmployeeMinimal(
          { id: 'employee', firstName: null } as never,
          'org',
        ),
      ).rejects.toThrow('names cannot be cleared');
      expect(repo.findOne).not.toHaveBeenCalled();
    });
    it('updates optional data through the minimal endpoint without replacing existing names', async () => {
      employee.profile.privateEmail = 'before@example.test';
      await service.updateEmployeeMinimal(
        { id: 'employee', expectedVersion: 1, privateEmail: null } as never,
        'org',
        'actor-member',
      );
      expect(employee.profile.firstName).toBe('Anna');
      expect(employee.profile.lastName).toBe('Test');
      expect(employee.profile.privateEmail).toBeNull();
    });
  });
  it.each([
    'title',
    'dateOfBirth',
    'socialSecurityNumber',
    'privateEmail',
    'street',
    'houseNumber',
    'addressLine2',
    'postalCode',
    'city',
    'country',
    'avatarUrl',
    'language',
  ])('clears optional profile field %s', async (field) => {
    (employee.profile as Record<string, unknown>)[field] =
      field === 'dateOfBirth' ? '2000-01-01' : 'old';
    await patch({ [field]: null });
    expect(employee.profile).toHaveProperty(field, null);
  });
  it.each(['contactPhone', 'contactPhone2'])(
    'clears optional membership field %s',
    async (field) => {
      (membership as unknown as Record<string, unknown>)[field] =
        '+41790000000';
      await patch({ [field]: null });
      expect(membership).toHaveProperty(field, null);
    },
  );
  it('does not log unchanged data or touch role assignments', async () => {
    membership.roles = [{ id: 'one' }, { id: 'two' }] as Membership['roles'];
    await patch();
    expect(audit.logChanges).not.toHaveBeenCalled();
    expect(membership.roles?.map((r) => r.id)).toEqual(['one', 'two']);
  });
  it.each([undefined, 0, 99])(
    'rejects missing or stale version %s without writes',
    async (expectedVersion) => {
      await expect(patch({ expectedVersion })).rejects.toThrow();
      expect(manager.save).not.toHaveBeenCalled();
    },
  );
  it('rejects a foreign employee before writing', async () => {
    employee.organizationId = 'foreign';
    await expect(patch()).rejects.toThrow('Employee not found');
    expect(manager.save).not.toHaveBeenCalled();
  });
  it.each([
    { firstName: ' ' },
    { lastName: 'X'.repeat(121) },
    { privateEmail: 'bad' },
    { dateOfBirth: '2000-02-30' },
  ])('validates basis fields %#', async (values) => {
    await expect(patch(values)).rejects.toThrow('Invalid employee fields');
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('rejects replacing a linked account address', async () => {
    employee.accountLinkStatus = 'CONFIRMED';
    await expect(patch({ email: 'other@example.test' })).rejects.toThrow(
      'account owner',
    );
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('creates an unlinked profile without looking up a globally existing email', async () => {
    await service.upsertEmployeeOnboardingDraft(
      { firstName: 'New', lastName: 'Employee', email: 'known@example.test' },
      'org',
    );
    expect(
      manager.findOne.mock.calls.some(
        ([entity]) => entity === User || entity === UserEmail,
      ),
    ).toBe(false);
    expect(manager.save).toHaveBeenCalledWith(
      Employee,
      expect.objectContaining({
        organizationId: 'org',
        accountLinkStatus: 'UNLINKED',
        profile: expect.objectContaining({ email: 'known@example.test' }),
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      Membership,
      expect.objectContaining({ userId: null, isActive: false }),
    );
  });
  it('deletes the unlinked draft and its placeholder without touching global accounts', async () => {
    await service.removeEmployeeOnboardingDraft('employee', 'org');
    expect(manager.update).toHaveBeenCalledWith(
      Membership,
      { id: 'member', organizationId: 'org' },
      { employeeId: null },
    );
    expect(manager.remove).toHaveBeenCalledTimes(2);
    expect(manager.remove).toHaveBeenCalledWith(Membership, membership);
    expect(manager.remove).toHaveBeenCalledWith(Employee, employee);
    expect(manager.delete).toHaveBeenCalledWith(EmployeeContract, {
      employeeId: 'employee',
      organizationId: 'org',
    });
  });
  it.each(['LEGACY', 'CONFIRMED'])(
    'protects a %s linked draft from deletion',
    async (status) => {
      employee.accountLinkStatus = status as Employee['accountLinkStatus'];
      await expect(
        service.removeEmployeeOnboardingDraft('employee', 'org'),
      ).rejects.toThrow();
      expect(manager.remove).not.toHaveBeenCalled();
    },
  );
  it('protects an existing account even if link status is inconsistent', async () => {
    membership.userId = 'existing-account';
    await expect(
      service.removeEmployeeOnboardingDraft('employee', 'org'),
    ).rejects.toThrow();
    expect(manager.remove).not.toHaveBeenCalled();
  });
  it.each([EmployeeInvitationStatus.SENT, EmployeeInvitationStatus.SCHEDULED])(
    'rejects deletion after invitation %s',
    async (status) => {
      employee.invitationStatus = status;
      await expect(
        service.removeEmployeeOnboardingDraft('employee', 'org'),
      ).rejects.toThrow();
      expect(manager.remove).not.toHaveBeenCalled();
    },
  );
});
