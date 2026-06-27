import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
  let assigneesRepo: jest.Mocked<Pick<Repository<TaskAssignee>, 'find'>>;
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
    assigneesRepo = { find: jest.fn() };
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
          select: ['taskId'],
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
});
