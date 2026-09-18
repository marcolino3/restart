import type { Request } from 'express';
import { EntityManager } from 'typeorm';
import { auth } from '@/lib/auth';
import { Membership } from '@/memberships/entities/membership.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { User } from '@/users/entities/user.entity';
import { EmployeeAccountController } from './employee-account.controller';
import { EmployeeAccountInvitation } from './entities/employee-account-invitation.entity';
import { Employee } from './entities/employee.entity';

jest.mock('@/lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));

describe('employee account acceptance boundaries', () => {
  const token = 'a'.repeat(64);
  const request = { headers: {} } as Request;
  let manager: Record<string, jest.Mock>;
  let controller: EmployeeAccountController;
  let employee: Record<string, any>;
  let invitation: Record<string, any>;
  let pending: Record<string, any>;
  let existing: Record<string, any> | null;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(auth.api.getSession).mockResolvedValue({
      user: {
        id: 'auth',
        email: 'invite@example.test',
        name: 'Account Owner',
      },
    } as never);
    employee = {
      id: 'employee',
      organizationId: 'org',
      accountLinkStatus: 'UNLINKED',
      profile: { email: 'invite@example.test' },
      organization: { name: 'Test school' },
    };
    invitation = {
      employeeId: 'employee',
      organizationId: 'org',
      email: 'invite@example.test',
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      employee,
    };
    pending = {
      id: 'pending',
      employeeId: 'employee',
      isActive: false,
      roles: [{ id: 'new-role' }],
    };
    existing = null;
    manager = {
      transaction: jest.fn(
        (callback: (m: typeof manager) => Promise<unknown>) =>
          callback(manager),
      ),
      findOne: jest.fn((entity) =>
        Promise.resolve(
          entity === Employee
            ? employee
            : entity === Membership
              ? existing
              : invitation,
        ),
      ),
      findOneOrFail: jest.fn((entity) =>
        Promise.resolve(entity === Membership ? pending : { id: 'org' }),
      ),
      find: jest
        .fn()
        .mockResolvedValue([{ id: 'address', userId: 'domain-user' }]),
      query: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity, value) =>
        Promise.resolve(
          entity === User
            ? { ...value, id: 'new-user' }
            : entity === UserEmail
              ? { ...value, id: 'new-address' }
              : value,
        ),
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    controller = new EmployeeAccountController(
      manager as unknown as EntityManager,
    );
  });

  it('preview discloses only the organization name', async () => {
    await expect(controller.preview({ token })).resolves.toEqual({
      organizationName: 'Test school',
    });
  });
  it.each(['malformed', 'missing', 'consumed', 'expired', 'changed email'])(
    'rejects %s preview tokens',
    async (scenario) => {
      if (scenario === 'missing') manager.findOne.mockResolvedValue(null);
      if (scenario === 'consumed') invitation.consumedAt = new Date();
      if (scenario === 'expired') invitation.expiresAt = new Date(0);
      if (scenario === 'changed email')
        employee.profile.email = 'changed@example.test';
      await expect(
        controller.preview({ token: scenario === 'malformed' ? '' : token }),
      ).rejects.toThrow('Invalid invitation');
    },
  );
  it('requires a real signed-in account', async () => {
    jest.mocked(auth.api.getSession).mockResolvedValue(null);
    await expect(controller.accept({ token }, request)).rejects.toThrow(
      'Sign in',
    );
    expect(manager.transaction).not.toHaveBeenCalled();
  });
  it.each([
    'malformed',
    'missing',
    'consumed',
    'expired',
    'wrong account',
    'missing employee',
    'linked employee',
    'changed email',
    'ambiguous account',
    'different employee',
  ])('rejects %s acceptance without mutating membership', async (scenario) => {
    if (scenario === 'missing') manager.findOne.mockResolvedValue(null);
    if (scenario === 'consumed') invitation.consumedAt = new Date();
    if (scenario === 'expired') invitation.expiresAt = new Date(0);
    if (scenario === 'wrong account')
      jest
        .mocked(auth.api.getSession)
        .mockResolvedValue({ user: { email: 'other@example.test' } } as never);
    if (scenario === 'missing employee')
      manager.findOne.mockImplementation((entity) =>
        Promise.resolve(entity === Employee ? null : invitation),
      );
    if (scenario === 'linked employee')
      employee.accountLinkStatus = 'CONFIRMED';
    if (scenario === 'changed email')
      employee.profile.email = 'changed@example.test';
    if (scenario === 'ambiguous account')
      manager.find.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
    if (scenario === 'different employee')
      existing = { id: 'existing', employeeId: 'another' };
    await expect(
      controller.accept(
        { token: scenario === 'malformed' ? '' : token },
        request,
      ),
    ).rejects.toThrow();
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
    expect(manager.remove).not.toHaveBeenCalled();
  });
  it('activates the pending membership without modifying an existing global identity', async () => {
    await expect(controller.accept({ token }, request)).resolves.toEqual({
      organizationId: 'org',
    });
    expect(manager.save).toHaveBeenCalledWith(
      Membership,
      expect.objectContaining({
        id: 'pending',
        isActive: true,
        userId: 'domain-user',
        userEmailId: 'address',
      }),
    );
    expect(
      manager.save.mock.calls.some(
        ([entity]) => entity === User || entity === UserEmail,
      ),
    ).toBe(false);
    expect(manager.save).toHaveBeenCalledWith(
      EmployeeAccountInvitation,
      expect.objectContaining({ consumedAt: expect.any(Date) }),
    );
  });
  it('creates a new identity only after authenticated acceptance', async () => {
    manager.find.mockResolvedValue([]);
    await controller.accept({ token }, request);
    expect(manager.save).toHaveBeenCalledWith(User, {
      firstName: 'Account Owner',
      lastName: '',
    });
    expect(manager.save).toHaveBeenCalledWith(
      Membership,
      expect.objectContaining({
        userId: 'new-user',
        userEmailId: 'new-address',
      }),
    );
  });
  it('merges existing membership roles and removes only the pending placeholder', async () => {
    existing = {
      id: 'existing',
      userId: 'domain-user',
      roles: [{ id: 'old-role' }, { id: 'new-role' }],
    };
    await controller.accept({ token }, request);
    expect(manager.save).toHaveBeenCalledWith(
      Membership,
      expect.objectContaining({
        id: 'existing',
        employeeId: 'employee',
        isActive: true,
        roles: [{ id: 'old-role' }, { id: 'new-role' }],
      }),
    );
    expect(manager.remove).toHaveBeenCalledWith(Membership, pending);
    expect(manager.remove.mock.calls).toHaveLength(1);
  });
});
