import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskStatus } from './entities/task-status.enum';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

const ORG = 'org-1';
const ME = 'membership-me';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: jest.Mocked<Pick<Repository<Task>, 'find' | 'findOne'>>;
  let assigneesRepo: jest.Mocked<
    Pick<Repository<TaskAssignee>, 'find' | 'save'>
  >;
  let membersRepo: jest.Mocked<Pick<Repository<ProjectMember>, 'find'>>;
  let access: jest.Mocked<
    Pick<ProjectAccessService, 'assertCanEditTasks' | 'assertCanView'>
  >;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    tasksRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    assigneesRepo = { find: jest.fn(), save: jest.fn() };
    membersRepo = { find: jest.fn() };
    access = {
      assertCanEditTasks: jest.fn().mockResolvedValue({ id: 'p1' }),
      assertCanView: jest.fn().mockResolvedValue({ id: 'p1' }),
    };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(TaskAssignee), useValue: assigneesRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
        {
          provide: getRepositoryToken(Membership),
          useValue: { find: jest.fn() },
        },
        { provide: ProjectAccessService, useValue: access },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  describe('findAssignedTo (My Tasks)', () => {
    it('scopes assignments to the org + caller + active rows', async () => {
      assigneesRepo.find.mockResolvedValue([{ taskId: 't1' } as TaskAssignee]);
      tasksRepo.find.mockResolvedValue([{ id: 't1' } as Task]);

      await service.findAssignedTo(ORG, ME);

      expect(assigneesRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG, membershipId: ME, isActive: true },
          order: { sortOrder: 'ASC' },
        }),
      );
      expect(tasksRepo.find).toHaveBeenCalled();
    });

    it('returns [] when the caller has no assignments', async () => {
      assigneesRepo.find.mockResolvedValue([]);

      const result = await service.findAssignedTo(ORG, ME);

      expect(result).toEqual([]);
      expect(tasksRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('reorderAssigned', () => {
    it('rejects task ids that are not assigned to the caller', async () => {
      // Caller has only one of the two requested assignee rows.
      assigneesRepo.find.mockResolvedValue([
        { taskId: 't1', membershipId: ME } as TaskAssignee,
      ]);

      await expect(
        service.reorderAssigned(ORG, ME, ['t1', 'foreign']),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('scopes the lookup to the caller and persists the new order', async () => {
      const a1 = {
        taskId: 't1',
        membershipId: ME,
        sortOrder: 0,
      } as TaskAssignee;
      const a2 = {
        taskId: 't2',
        membershipId: ME,
        sortOrder: 1,
      } as TaskAssignee;
      assigneesRepo.find.mockResolvedValue([a1, a2]);
      const saved: TaskAssignee[] = [];
      (assigneesRepo.save as jest.Mock).mockImplementation(
        (v: TaskAssignee[]) => {
          saved.push(...v);
          return Promise.resolve(v);
        },
      );

      await service.reorderAssigned(ORG, ME, ['t2', 't1']);

      expect(assigneesRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG,
            membershipId: ME,
            isActive: true,
          }),
        }),
      );
      expect(saved.find((a) => a.taskId === 't2')?.sortOrder).toBe(0);
      expect(saved.find((a) => a.taskId === 't1')?.sortOrder).toBe(1);
    });
  });

  describe('create', () => {
    it('rejects assignees that are not members of the project', async () => {
      membersRepo.find.mockResolvedValue([]); // requested id is not a member

      await expect(
        service.create(
          { projectId: 'p1', title: 'T', assigneeMembershipIds: ['outsider'] },
          ORG,
          ME,
          false,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('rejects reordering tasks from another project', async () => {
      tasksRepo.findOne.mockResolvedValue({
        id: 't1',
        projectId: 'p1',
        organizationId: ORG,
      } as Task);
      // Only one of the two ids belongs to the project.
      tasksRepo.find.mockResolvedValue([{ id: 't1' } as Task]);

      await expect(
        service.move(
          {
            id: 't1',
            status: TaskStatus.DONE,
            orderedTaskIds: ['t1', 'foreign'],
          },
          ORG,
          ME,
          false,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update (completedAt + checklist)', () => {
    const manager = { getRepository: () => ({ save: jest.fn((d: Task) => d) }) };

    beforeEach(() => {
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(manager),
      );
    });

    it('sets completedAt on the transition into DONE', async () => {
      const task = {
        id: 't1',
        projectId: 'p1',
        organizationId: ORG,
        status: TaskStatus.OPEN,
        completedAt: null,
      } as unknown as Task;
      tasksRepo.findOne.mockResolvedValue(task);

      const saved = await service.update(
        { id: 't1', status: TaskStatus.DONE },
        ORG,
        ME,
        false,
      );
      expect(saved.status).toBe(TaskStatus.DONE);
      expect(saved.completedAt).toBeInstanceOf(Date);
    });

    it('clears completedAt when a done task is reopened', async () => {
      const task = {
        id: 't1',
        projectId: 'p1',
        organizationId: ORG,
        status: TaskStatus.DONE,
        completedAt: new Date('2026-06-01T10:00:00Z'),
      } as unknown as Task;
      tasksRepo.findOne.mockResolvedValue(task);

      const saved = await service.update(
        { id: 't1', status: TaskStatus.OPEN },
        ORG,
        ME,
        false,
      );
      expect(saved.completedAt).toBeNull();
    });

    it('keeps completedAt untouched when the status does not change', async () => {
      const completedAt = new Date('2026-06-01T10:00:00Z');
      const task = {
        id: 't1',
        projectId: 'p1',
        organizationId: ORG,
        status: TaskStatus.DONE,
        completedAt,
      } as unknown as Task;
      tasksRepo.findOne.mockResolvedValue(task);

      const saved = await service.update(
        { id: 't1', status: TaskStatus.DONE, title: 'Neu' },
        ORG,
        ME,
        false,
      );
      expect(saved.completedAt).toBe(completedAt);
    });

    it('normalises the checklist: assigns ids, trims labels, drops empties', async () => {
      const task = {
        id: 't1',
        projectId: 'p1',
        organizationId: ORG,
        status: TaskStatus.OPEN,
        checklist: [],
      } as unknown as Task;
      tasksRepo.findOne.mockResolvedValue(task);

      const saved = await service.update(
        {
          id: 't1',
          checklist: [
            { label: '  Grill besetzen  ', done: false },
            { label: '   ', done: true },
            { id: '4f2c0e9e-0000-4000-8000-000000000001', label: 'Kasse', done: true },
          ],
        },
        ORG,
        ME,
        false,
      );
      expect(saved.checklist).toHaveLength(2);
      expect(saved.checklist[0].label).toBe('Grill besetzen');
      expect(saved.checklist[0].id).toEqual(expect.any(String));
      expect(saved.checklist[1].id).toBe(
        '4f2c0e9e-0000-4000-8000-000000000001',
      );
    });
  });
});
