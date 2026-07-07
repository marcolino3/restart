import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Not } from 'typeorm';

import { AdmissionReminderNotifierService } from './admission-reminder-notifier.service';
import { AdmissionReminder } from './entities/admission-reminder.entity';
import { SmtpService } from './smtp.service';

const ORG_ID = 'org-1';

function makeReminder(
  overrides: Partial<AdmissionReminder> = {},
): AdmissionReminder {
  return {
    id: 'rem-1',
    organizationId: ORG_ID,
    applicationId: 'app-1',
    dueAt: new Date('2026-07-01T09:00:00.000Z'),
    title: 'Rückruf Familie Krasniqi',
    note: 'Schnuppertag vereinbaren',
    assignedToMembershipId: 'mem-1',
    completedAt: null,
    notifiedAt: null,
    application: { childFirstName: 'Lea', childLastName: 'Meier' },
    assignedToMembership: {
      user: {
        firstName: 'Anna',
        lastName: 'Muster',
        userEmails: [{ email: 'anna@schule.ch', isPrimary: true }],
      },
    },
    ...overrides,
  } as unknown as AdmissionReminder;
}

type SentMail = {
  organizationId: string;
  to: string;
  toName: string | null;
  subject: string;
  html: string;
};

describe('AdmissionReminderNotifierService', () => {
  let service: AdmissionReminderNotifierService;
  let repo: {
    find: jest.Mock;
    save: jest.Mock;
  };
  let smtp: { isConfigured: jest.Mock; send: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((e: unknown) => Promise.resolve(e)),
    };
    smtp = {
      isConfigured: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue({ messageId: 'mid-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionReminderNotifierService,
        { provide: getRepositoryToken(AdmissionReminder), useValue: repo },
        { provide: SmtpService, useValue: smtp },
      ],
    }).compile();

    service = module.get(AdmissionReminderNotifierService);
  });

  it('only scans open, unnotified reminders that are due and assigned', async () => {
    await service.notifyDueReminders();

    const where = (
      repo.find.mock.calls[0][0] as { where: Record<string, unknown> }
    ).where;
    expect(where.completedAt).toEqual(IsNull());
    expect(where.notifiedAt).toEqual(IsNull());
    expect(where.assignedToMembershipId).toEqual(Not(IsNull()));
    expect(where.dueAt).toBeInstanceOf(LessThanOrEqual(new Date()).constructor);
  });

  it('emails the assignee and stamps notifiedAt exactly once', async () => {
    repo.find.mockResolvedValue([makeReminder()]);

    await service.notifyDueReminders();

    expect(smtp.send).toHaveBeenCalledTimes(1);
    const sent = smtp.send.mock.calls[0][0] as SentMail;
    expect(sent.organizationId).toBe(ORG_ID);
    expect(sent.to).toBe('anna@schule.ch');
    expect(sent.toName).toBe('Anna Muster');
    expect(sent.subject).toContain('Rückruf Familie Krasniqi');
    expect(sent.subject).toContain('Lea Meier');

    // notifiedAt stamped so it will not be re-mailed next run.
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0][0] as AdmissionReminder;
    expect(saved.notifiedAt).toBeInstanceOf(Date);
  });

  it('escapes user-controlled fields in the email body (no HTML injection)', async () => {
    repo.find.mockResolvedValue([
      makeReminder({ note: '<script>alert(1)</script>' }),
    ]);

    await service.notifyDueReminders();

    const html = (smtp.send.mock.calls[0][0] as SentMail).html;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('skips (without stamping) when the org has no SMTP configured — retried later', async () => {
    smtp.isConfigured.mockResolvedValue(false);
    repo.find.mockResolvedValue([makeReminder()]);

    await service.notifyDueReminders();

    expect(smtp.send).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('skips (without stamping) when the assignee has no deliverable email', async () => {
    repo.find.mockResolvedValue([
      makeReminder({
        assignedToMembership: {
          user: { firstName: 'Anna', lastName: 'Muster', userEmails: [] },
        },
      } as unknown as Partial<AdmissionReminder>),
    ]);

    await service.notifyDueReminders();

    expect(smtp.send).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('a failing reminder does not block the others', async () => {
    smtp.send
      .mockRejectedValueOnce(new Error('smtp down'))
      .mockResolvedValueOnce({ messageId: 'mid-2' });
    repo.find.mockResolvedValue([
      makeReminder({ id: 'rem-1' }),
      makeReminder({
        id: 'rem-2',
        organizationId: 'org-2',
      }),
    ]);

    await service.notifyDueReminders();

    // Both attempted; the second still sends despite the first throwing.
    expect(smtp.send).toHaveBeenCalledTimes(2);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect((repo.save.mock.calls[0][0] as AdmissionReminder).id).toBe('rem-2');
  });
});
