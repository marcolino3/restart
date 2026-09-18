import { EntityManager } from 'typeorm';
import { createHash } from 'node:crypto';
import { mailer } from '@/lib/mailer';
import { EmployeeInvitationService } from './employee-invitation.service';
import { Employee, EmployeeInvitationStatus } from './entities/employee.entity';
import { EmployeeAccountInvitation } from './entities/employee-account-invitation.entity';

jest.mock('@/lib/mailer', () => ({
  mailer: { sendEmployeeInvitation: jest.fn() },
}));

describe('purpose-bound employee invitations', () => {
  let manager: any;
  let service: EmployeeInvitationService;
  let employee: any;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mailer.sendEmployeeInvitation).mockResolvedValue(undefined);
    employee = {
      id: 'employee',
      organizationId: 'org',
      accountLinkStatus: 'UNLINKED',
      profile: { email: ' Invite@Example.Test ' },
    };
    manager = {
      queryRunner: { isTransactionActive: true },
      transaction: jest.fn(),
      findOneOrFail: jest.fn().mockResolvedValue({ id: 'org', name: 'School' }),
      findOne: jest.fn().mockImplementation(() => Promise.resolve(employee)),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    service = new EmployeeInvitationService(manager as EntityManager);
  });
  it('creates distinct one-time hashes and marks sent only after mail succeeds', async () => {
    const before = Date.now();
    await service.sendInvite('employee', 'org');
    const [email, url, organization] = jest.mocked(
      mailer.sendEmployeeInvitation,
    ).mock.calls[0];
    expect(email).toBe('invite@example.test');
    expect(organization).toBe('School');
    const token = new URL(url).searchParams.get('token')!;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(manager.save).toHaveBeenCalledWith(
      EmployeeAccountInvitation,
      expect.objectContaining({
        employeeId: 'employee',
        organizationId: 'org',
        tokenHash: createHash('sha256').update(token).digest('hex'),
      }),
    );
    expect(
      manager.save.mock.calls[0][1].expiresAt.getTime(),
    ).toBeGreaterThanOrEqual(before + 48 * 60 * 60 * 1000);
    expect(manager.delete).toHaveBeenCalledWith(EmployeeAccountInvitation, {
      employeeId: 'employee',
      organizationId: 'org',
    });
    expect(manager.update).toHaveBeenCalledWith(
      Employee,
      { id: 'employee' },
      expect.objectContaining({
        invitationStatus: EmployeeInvitationStatus.SENT,
        invitationScheduledSendAt: null,
      }),
    );
    expect(manager.update.mock.invocationCallOrder[0]).toBeGreaterThan(
      jest.mocked(mailer.sendEmployeeInvitation).mock.invocationCallOrder[0],
    );
  });
  it('starts its own transaction when no transaction is supplied', async () => {
    manager.queryRunner.isTransactionActive = false;
    manager.transaction.mockImplementation(
      (callback: (transaction: EntityManager) => Promise<void>) =>
        callback({ ...manager, queryRunner: { isTransactionActive: true } }),
    );
    await service.sendInvite('employee', 'org');
    expect(manager.transaction).toHaveBeenCalledTimes(1);
    expect(mailer.sendEmployeeInvitation).toHaveBeenCalledTimes(1);
  });
  it.each(['missing', 'missing email', 'confirmed'])(
    'does not send when employee is %s',
    async (scenario) => {
      if (scenario === 'missing') employee = null;
      if (scenario === 'missing email') employee.profile.email = null;
      if (scenario === 'confirmed') employee.accountLinkStatus = 'CONFIRMED';
      const result = service.sendInvite('employee', 'org');
      if (scenario === 'confirmed')
        await expect(result).resolves.toBeUndefined();
      else await expect(result).rejects.toThrow();
      expect(manager.save).not.toHaveBeenCalled();
      expect(mailer.sendEmployeeInvitation).not.toHaveBeenCalled();
    },
  );
  it('propagates mail failure for rollback and never marks the employee sent', async () => {
    jest
      .mocked(mailer.sendEmployeeInvitation)
      .mockRejectedValue(new Error('mail unavailable'));
    await expect(service.sendInvite('employee', 'org')).rejects.toThrow(
      'mail unavailable',
    );
    expect(manager.update).not.toHaveBeenCalled();
  });
  it('schedules without creating an account or sending mail', async () => {
    const date = new Date('2027-01-01');
    await service.scheduleInvite('employee', date);
    expect(manager.update).toHaveBeenCalledWith(
      Employee,
      { id: 'employee' },
      {
        invitationStatus: EmployeeInvitationStatus.SCHEDULED,
        invitationScheduledSendAt: date,
      },
    );
    expect(mailer.sendEmployeeInvitation).not.toHaveBeenCalled();
  });
  it('continues scheduled delivery after an individual failure', async () => {
    manager.find.mockResolvedValue([
      { id: 'first', organizationId: 'org' },
      { id: 'second', organizationId: 'other' },
    ]);
    const send = jest
      .spyOn(service, 'sendInvite')
      .mockRejectedValueOnce(new Error('mail unavailable'))
      .mockResolvedValueOnce();
    await service.sendDueScheduledInvitations(new Date());
    expect(send).toHaveBeenNthCalledWith(1, 'first', 'org');
    expect(send).toHaveBeenNthCalledWith(2, 'second', 'other');
  });
});
