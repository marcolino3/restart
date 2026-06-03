import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, IsNull, LessThan, Not } from 'typeorm';

import { AdmissionRemindersService } from './admission-reminders.service';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionReminder } from './entities/admission-reminder.entity';
import { AdmissionReminderFilter } from './enums/admission-reminder-filter.enum';

const ORG_ID = 'org-1';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('AdmissionRemindersService', () => {
  let service: AdmissionRemindersService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionRemindersService,
        { provide: getRepositoryToken(AdmissionReminder), useValue: repo },
        {
          provide: getRepositoryToken(AdmissionApplication),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(AdmissionRemindersService);
  });

  describe('findForOrg', () => {
    const findArgs = () => {
      const calls = repo.find.mock.calls as Array<
        [{ where: Record<string, unknown>; order: Record<string, unknown> }]
      >;
      return calls[0]?.[0];
    };
    const whereOf = () => findArgs().where;

    it('COMPLETED returns only reminders with completedAt set (regression)', async () => {
      // Bug: the COMPLETED branch built no completedAt constraint, so the
      // "Erledigt" tab also surfaced open reminders.
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.COMPLETED);

      const where = whereOf();
      expect(where.organizationId).toBe(ORG_ID);
      expect(where.completedAt).toEqual(Not(IsNull()));
      // Must NOT be filtered to open reminders.
      expect(where.completedAt).not.toEqual(IsNull());
      // Completed reminders are ordered by completion time, newest first.
      expect(findArgs().order).toEqual({ completedAt: 'DESC' });
    });

    it('OPEN returns only reminders without completedAt', async () => {
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.OPEN);

      const where = whereOf();
      expect(where.completedAt).toEqual(IsNull());
      expect(where.dueAt).toBeUndefined();
    });

    it('OVERDUE filters open reminders due before today', async () => {
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.OVERDUE);

      const where = whereOf();
      expect(where.completedAt).toEqual(IsNull());
      expect(where.dueAt).toBeInstanceOf(LessThan(new Date()).constructor);
    });

    it('TODAY and WEEK filter open reminders within a due-date range', async () => {
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.TODAY);
      expect(whereOf().completedAt).toEqual(IsNull());
      expect(whereOf().dueAt).toBeInstanceOf(
        Between(new Date(), new Date()).constructor,
      );

      repo.find.mockClear();
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.WEEK);
      expect(whereOf().completedAt).toEqual(IsNull());
      expect(whereOf().dueAt).toBeInstanceOf(
        Between(new Date(), new Date()).constructor,
      );
    });

    it('always scopes to the active organization', async () => {
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.OPEN);
      expect(whereOf().organizationId).toBe(ORG_ID);
    });
  });
});
