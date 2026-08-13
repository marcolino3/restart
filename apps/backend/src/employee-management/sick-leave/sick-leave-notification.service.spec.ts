import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { SmtpService } from '@/school-management/admissions/smtp.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { SickLeaveNotificationService } from './sick-leave-notification.service';
import { SICK_LEAVE_SETTING_KEYS } from './sick-leave-setting-keys';

const ORG_ID = 'org-1';
const EMPLOYEE_ID = 'employee-1';

/**
 * `resolveRecipients` fires two raw SQL queries: team leads first, own emails
 * second. Both are answered positionally in call order.
 */
const queryResponder = (
  leads: Array<{
    email: string;
    first_name: string | null;
    last_name: string | null;
  }>,
  ownEmails: Array<{ email: string }>,
) => {
  const leadQuery = jest.fn().mockResolvedValue(leads);
  const ownQuery = jest.fn().mockResolvedValue(ownEmails);
  return jest.fn().mockImplementation((sql: string) => {
    if (sql.includes('own_teams')) return leadQuery(sql);
    return ownQuery(sql);
  });
};

const notifyInput = (overrides: Record<string, unknown> = {}) => ({
  organizationId: ORG_ID,
  employeeId: EMPLOYEE_ID,
  employeeName: 'Anna Muster',
  startDate: new Date(Date.UTC(2026, 2, 2)),
  endDate: new Date(Date.UTC(2026, 2, 2)),
  isExtension: false,
  ...overrides,
});

describe('SickLeaveNotificationService', () => {
  let service: SickLeaveNotificationService;
  let entityManager: {
    query: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let smtp: { send: jest.Mock };
  let organizationSettings: { getDecryptedValue: jest.Mock };
  let contract: unknown = null;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    contract = null;
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(() => Promise.resolve(contract)),
    };

    entityManager = {
      query: queryResponder([], []),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    smtp = { send: jest.fn().mockResolvedValue(undefined) };
    organizationSettings = {
      getDecryptedValue: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SickLeaveNotificationService,
        { provide: EntityManager, useValue: entityManager },
        { provide: SmtpService, useValue: smtp },
        {
          provide: OrganizationSettingsService,
          useValue: organizationSettings,
        },
      ],
    }).compile();

    service = module.get(SickLeaveNotificationService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('resolveRecipients', () => {
    it('combines team leads, the supervisor and the fixed org address', async () => {
      entityManager.query = queryResponder(
        [{ email: 'lead@example.ch', first_name: 'Lea', last_name: 'Lead' }],
        [{ email: 'anna@example.ch' }],
      );
      contract = {
        supervisor: {
          organizationId: ORG_ID,
          userEmail: { email: 'boss@example.ch' },
          user: { firstName: 'Bea', lastName: 'Boss' },
        },
      };
      organizationSettings.getDecryptedValue.mockResolvedValue('hr@example.ch');

      const recipients = await service.resolveRecipients({
        organizationId: ORG_ID,
        employeeId: EMPLOYEE_ID,
      });

      expect(recipients).toEqual([
        { email: 'lead@example.ch', name: 'Lea Lead' },
        { email: 'boss@example.ch', name: 'Bea Boss' },
        { email: 'hr@example.ch', name: null },
      ]);
      expect(organizationSettings.getDecryptedValue).toHaveBeenCalledWith(
        ORG_ID,
        SICK_LEAVE_SETTING_KEYS.notificationEmail,
      );
    });

    it('deduplicates an address that is both lead and supervisor', async () => {
      entityManager.query = queryResponder(
        [{ email: 'Lead@Example.ch', first_name: 'Lea', last_name: 'Lead' }],
        [],
      );
      contract = {
        supervisor: {
          organizationId: ORG_ID,
          userEmail: { email: 'lead@example.ch' },
          user: { firstName: 'Lea', lastName: 'Lead' },
        },
      };

      const recipients = await service.resolveRecipients({
        organizationId: ORG_ID,
        employeeId: EMPLOYEE_ID,
      });

      expect(recipients).toHaveLength(1);
      expect(recipients[0].email).toBe('Lead@Example.ch');
    });

    it('never mails the reporting employee, regardless of casing', async () => {
      entityManager.query = queryResponder(
        [{ email: 'ANNA@example.ch', first_name: 'Anna', last_name: 'Muster' }],
        [{ email: 'anna@example.ch' }],
      );

      const recipients = await service.resolveRecipients({
        organizationId: ORG_ID,
        employeeId: EMPLOYEE_ID,
      });

      expect(recipients).toEqual([]);
    });

    it('drops a supervisor membership belonging to another organization', async () => {
      contract = {
        supervisor: {
          organizationId: 'org-other',
          userEmail: { email: 'foreign-boss@example.ch' },
          user: { firstName: 'Fremd', lastName: 'Boss' },
        },
      };

      const recipients = await service.resolveRecipients({
        organizationId: ORG_ID,
        employeeId: EMPLOYEE_ID,
      });

      expect(recipients).toEqual([]);
    });

    it('ignores a blank fixed address', async () => {
      organizationSettings.getDecryptedValue.mockResolvedValue('   ');

      const recipients = await service.resolveRecipients({
        organizationId: ORG_ID,
        employeeId: EMPLOYEE_ID,
      });

      expect(recipients).toEqual([]);
    });

    it('scopes both raw queries to the organization', async () => {
      const query = queryResponder([], []);
      entityManager.query = query;

      await service.resolveRecipients({
        organizationId: ORG_ID,
        employeeId: EMPLOYEE_ID,
      });

      for (const call of query.mock.calls) {
        expect(call[1]).toEqual([EMPLOYEE_ID, ORG_ID]);
      }
    });
  });

  describe('notify', () => {
    beforeEach(() => {
      entityManager.query = queryResponder(
        [{ email: 'lead@example.ch', first_name: 'Lea', last_name: 'Lead' }],
        [],
      );
    });

    it('sends one org-scoped mail per recipient', async () => {
      organizationSettings.getDecryptedValue.mockResolvedValue('hr@example.ch');

      await service.notify(notifyInput());

      expect(smtp.send).toHaveBeenCalledTimes(2);
      expect(smtp.send).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          to: 'lead@example.ch',
        }),
      );
    });

    it('sends nothing when no recipient can be resolved', async () => {
      entityManager.query = queryResponder([], []);

      await service.notify(notifyInput());

      expect(smtp.send).not.toHaveBeenCalled();
    });

    it('keeps delivering after one recipient fails', async () => {
      organizationSettings.getDecryptedValue.mockResolvedValue('hr@example.ch');
      smtp.send
        .mockRejectedValueOnce(new Error('mailbox full'))
        .mockResolvedValueOnce(undefined);

      await expect(service.notify(notifyInput())).resolves.toBeUndefined();

      expect(smtp.send).toHaveBeenCalledTimes(2);
    });

    it('swallows a recipient resolution failure', async () => {
      entityManager.query = jest.fn().mockRejectedValue(new Error('db down'));

      await expect(service.notify(notifyInput())).resolves.toBeUndefined();
      expect(smtp.send).not.toHaveBeenCalled();
    });

    it('marks an extension differently from a fresh report', async () => {
      await service.notify(notifyInput({ isExtension: false }));
      const fresh = smtp.send.mock.calls[0][0] as {
        subject: string;
        html: string;
      };

      smtp.send.mockClear();
      await service.notify(
        notifyInput({
          isExtension: true,
          endDate: new Date(Date.UTC(2026, 2, 3)),
        }),
      );
      const extended = smtp.send.mock.calls[0][0] as {
        subject: string;
        html: string;
      };

      expect(extended.subject).not.toBe(fresh.subject);
      expect(extended.html).toContain('03.03.2026');
    });

    it('renders the start time when the employee fell ill mid-day', async () => {
      await service.notify(notifyInput({ startTime: '13:00:00' }));

      const mail = smtp.send.mock.calls[0][0] as { html: string };
      expect(mail.html).toContain('13:00');
      expect(mail.html).not.toContain('13:00:00');
    });
  });
});
