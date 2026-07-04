import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, DataSource, IsNull, LessThan, Not } from 'typeorm';

import { Task } from '@/project-management/tasks/entities/task.entity';
import { TaskAssignee } from '@/project-management/tasks/entities/task-assignee.entity';
import { TaskStatus } from '@/project-management/tasks/entities/task-status.enum';
import { AdmissionRemindersService } from './admission-reminders.service';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionReminder } from './entities/admission-reminder.entity';
import { AdmissionReminderFilter } from './enums/admission-reminder-filter.enum';

const ORG_ID = 'org-1';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((d: unknown) => d),
  save: jest.fn((d: unknown) => Promise.resolve(d)),
  delete: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// A transaction manager that records the Task / TaskAssignee rows it writes, so
// tests can assert the mirrored task (matching the protocol-task test style).
function makeDataSource(capture: {
  tasks: Array<Record<string, unknown>>;
  assignees: Array<Record<string, unknown>>;
  deletedAssigneesFor: string[];
}) {
  const taskRepo = {
    create: (d: Record<string, unknown>) => d,
    save: (d: Record<string, unknown>) => {
      const row = { ...d, id: d.id ?? `task-${capture.tasks.length + 1}` };
      capture.tasks.push(row);
      return Promise.resolve(row);
    },
  };
  const assigneeRepo = {
    create: (d: Record<string, unknown>) => d,
    save: (d: Record<string, unknown>) => {
      capture.assignees.push(d);
      return Promise.resolve(d);
    },
    delete: (where: { taskId: string }) => {
      capture.deletedAssigneesFor.push(where.taskId);
      return Promise.resolve({ affected: 1 });
    },
  };
  const manager = {
    getRepository: (entity: unknown) =>
      entity === Task ? taskRepo : assigneeRepo,
  };
  return {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  } as unknown as DataSource;
}

describe('AdmissionRemindersService', () => {
  let service: AdmissionRemindersService;
  let repo: ReturnType<typeof createMockRepository>;
  let applicationsRepo: ReturnType<typeof createMockRepository>;
  let tasksRepo: ReturnType<typeof createMockRepository>;
  let capture: {
    tasks: Array<Record<string, unknown>>;
    assignees: Array<Record<string, unknown>>;
    deletedAssigneesFor: string[];
  };

  beforeEach(async () => {
    repo = createMockRepository();
    applicationsRepo = createMockRepository();
    tasksRepo = createMockRepository();
    capture = { tasks: [], assignees: [], deletedAssigneesFor: [] };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionRemindersService,
        { provide: getRepositoryToken(AdmissionReminder), useValue: repo },
        {
          provide: getRepositoryToken(AdmissionApplication),
          useValue: applicationsRepo,
        },
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: DataSource, useValue: makeDataSource(capture) },
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
      await service.findForOrg(ORG_ID, AdmissionReminderFilter.COMPLETED);

      const where = whereOf();
      expect(where.organizationId).toBe(ORG_ID);
      expect(where.completedAt).toEqual(Not(IsNull()));
      expect(where.completedAt).not.toEqual(IsNull());
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

  describe('reminder → task mirroring', () => {
    it('create mirrors the reminder as a personal task for its assignee', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      repo.save.mockImplementation((e: Record<string, unknown>) =>
        Promise.resolve({ ...e, id: 'rem-1' }),
      );

      await service.create(
        {
          applicationId: 'app-1',
          dueAt: '2026-07-10T09:00:00.000Z',
          title: 'Rückruf Familie Krasniqi',
          note: 'Schnuppertag vereinbaren',
          assignedToMembershipId: 'mem-assignee',
        },
        ORG_ID,
        'mem-creator',
      );

      expect(capture.tasks).toHaveLength(1);
      const task = capture.tasks[0];
      expect(task).toMatchObject({
        title: 'Rückruf Familie Krasniqi',
        description: 'Schnuppertag vereinbaren',
        status: TaskStatus.OPEN,
        projectId: null,
        organizationId: ORG_ID,
        admissionReminderId: 'rem-1',
        admissionApplicationId: 'app-1',
        dueDate: '2026-07-10',
      });
      // Assigned to the reminder's assignee, not the creator.
      expect(capture.assignees).toHaveLength(1);
      expect(capture.assignees[0]).toMatchObject({
        membershipId: 'mem-assignee',
        organizationId: ORG_ID,
      });
    });

    it('does not create a task when there is no assignee', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      repo.save.mockImplementation((e: Record<string, unknown>) =>
        Promise.resolve({ ...e, id: 'rem-2', assignedToMembershipId: null }),
      );

      await service.create(
        {
          applicationId: 'app-1',
          dueAt: '2026-07-10T09:00:00.000Z',
          title: 'Ohne Zuständige',
        },
        ORG_ID,
        null, // no creator membership → assignee stays null
      );

      expect(capture.tasks).toHaveLength(0);
      expect(capture.assignees).toHaveLength(0);
    });

    it('complete sets the linked task to DONE (org-scoped)', async () => {
      repo.findOne.mockResolvedValue({
        id: 'rem-1',
        organizationId: ORG_ID,
        completedAt: null,
      });

      await service.complete('rem-1', ORG_ID, 'mem-actor');

      expect(tasksRepo.update).toHaveBeenCalledWith(
        {
          admissionReminderId: 'rem-1',
          organizationId: ORG_ID,
          isActive: true,
        },
        { status: TaskStatus.DONE },
      );
    });

    it('uncomplete reopens the linked task (OPEN)', async () => {
      repo.findOne.mockResolvedValue({
        id: 'rem-1',
        organizationId: ORG_ID,
        completedAt: new Date(),
      });

      await service.uncomplete('rem-1', ORG_ID);

      expect(tasksRepo.update).toHaveBeenCalledWith(
        {
          admissionReminderId: 'rem-1',
          organizationId: ORG_ID,
          isActive: true,
        },
        { status: TaskStatus.OPEN },
      );
    });

    it('remove soft-deletes the linked task before deleting the reminder', async () => {
      repo.findOne.mockResolvedValue({ id: 'rem-1' });
      const order: string[] = [];
      tasksRepo.update.mockImplementation(() => {
        order.push('task-soft-delete');
        return Promise.resolve({ affected: 1 });
      });
      repo.delete.mockImplementation(() => {
        order.push('reminder-delete');
        return Promise.resolve({ affected: 1 });
      });

      await service.remove('rem-1', ORG_ID);

      // Order matters: the FK is ON DELETE SET NULL, so we must find & detach the
      // task before the reminder row is gone.
      expect(order).toEqual(['task-soft-delete', 'reminder-delete']);
      expect(tasksRepo.update).toHaveBeenCalledWith(
        {
          admissionReminderId: 'rem-1',
          organizationId: ORG_ID,
          isActive: true,
        },
        { isActive: false },
      );
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'rem-1',
        organizationId: ORG_ID,
      });
    });

    it('a reminder from another org cannot be completed (multi-tenant)', async () => {
      // findOne is org-scoped and returns nothing for a foreign org.
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.complete('rem-foreign', ORG_ID, 'mem-actor'),
      ).rejects.toThrow(/not found/i);
      expect(tasksRepo.update).not.toHaveBeenCalled();
    });
  });
});
