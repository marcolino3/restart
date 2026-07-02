import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { Project } from '@/project-management/projects/entities/project.entity';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { Task } from '@/project-management/tasks/entities/task.entity';
import { ProjectTemplateTask } from './entities/project-template-task.entity';
import { ProjectTemplate } from './entities/project-template.entity';
import { TemplatesService } from './templates.service';

const ORG = 'org-1';
const ME = 'membership-me';

type AnyMock = Record<string, jest.Mock>;

function makeManager(capture: {
  project?: Project;
  members: ProjectMember[];
  tasks: Task[];
  template?: ProjectTemplate;
  templateTasks: ProjectTemplateTask[];
}) {
  return {
    getRepository: (entity: unknown) => ({
      create: (d: unknown) => d,
      save: (d: unknown) => {
        if (entity === Project) {
          capture.project = { ...(d as object), id: 'p-new' } as Project;
          return Promise.resolve(capture.project);
        }
        if (entity === ProjectMember) {
          capture.members.push(...(d as ProjectMember[]));
          return Promise.resolve(d);
        }
        if (entity === Task) {
          capture.tasks.push(...(d as Task[]));
          return Promise.resolve(d);
        }
        if (entity === ProjectTemplate) {
          capture.template = {
            ...(d as object),
            id: 'tpl-new',
          } as ProjectTemplate;
          return Promise.resolve(capture.template);
        }
        if (entity === ProjectTemplateTask) {
          capture.templateTasks.push(...(d as ProjectTemplateTask[]));
          return Promise.resolve(d);
        }
        return Promise.resolve(d);
      },
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    }),
  };
}

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templatesRepo: AnyMock;
  let membershipsRepo: AnyMock;
  let access: { assertCanView: jest.Mock };
  let dataSource: { transaction: jest.Mock; getRepository: jest.Mock };

  beforeEach(async () => {
    templatesRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
    membershipsRepo = { find: jest.fn() };
    access = { assertCanView: jest.fn().mockResolvedValue({ id: 'p1' }) };
    dataSource = { transaction: jest.fn(), getRepository: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(ProjectTemplate),
          useValue: templatesRepo,
        },
        {
          provide: getRepositoryToken(ProjectTemplateTask),
          useValue: { delete: jest.fn(), save: jest.fn() },
        },
        { provide: getRepositoryToken(Membership), useValue: membershipsRepo },
        { provide: ProjectAccessService, useValue: access },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(TemplatesService);
  });

  it('findAll scopes templates to the active organization', async () => {
    templatesRepo.find.mockResolvedValue([]);
    await service.findAll(ORG);
    expect(templatesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
  });

  describe('instantiate', () => {
    it('creates the project with the creator as OWNER and resolves relative due dates', async () => {
      templatesRepo.findOne.mockResolvedValue({
        id: 'tpl1',
        title: 'Schuljahresanfang',
        description: null,
        organizationId: ORG,
        isActive: true,
        tasks: [
          { title: 'A', priority: 'HIGH', dueOffsetDays: 2, sortOrder: 0 },
          { title: 'B', priority: 'MEDIUM', dueOffsetDays: null, sortOrder: 1 },
        ],
      });
      const capture = {
        members: [] as ProjectMember[],
        tasks: [] as Task[],
        templateTasks: [] as ProjectTemplateTask[],
      };
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(makeManager(capture)),
      );

      const project = await service.instantiate(
        { templateId: 'tpl1', startDate: '2026-07-01' },
        ORG,
        ME,
      );

      expect(project).toEqual(expect.objectContaining({ id: 'p-new' }));
      expect(capture.members[0]).toEqual(
        expect.objectContaining({
          membershipId: ME,
          role: ProjectMemberRole.OWNER,
        }),
      );
      expect(capture.tasks).toHaveLength(2);
      expect(capture.tasks[0].dueDate).toBe('2026-07-03');
      expect(capture.tasks[1].dueDate).toBeNull();
    });
  });

  describe('saveProjectAsTemplate', () => {
    it('checks project visibility and copies the project tasks', async () => {
      dataSource.getRepository.mockReturnValue({
        find: jest
          .fn()
          .mockResolvedValue([{ title: 'X', priority: 'LOW', sortOrder: 0 }]),
      });
      const capture = {
        members: [] as ProjectMember[],
        tasks: [] as Task[],
        templateTasks: [] as ProjectTemplateTask[],
      };
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(makeManager(capture)),
      );

      const template = await service.saveProjectAsTemplate(
        { projectId: 'p1', title: 'New Template' },
        ORG,
        ME,
        false,
      );

      expect(access.assertCanView).toHaveBeenCalledWith(ORG, 'p1', ME, false);
      expect(template).toEqual(expect.objectContaining({ id: 'tpl-new' }));
      expect(capture.templateTasks).toHaveLength(1);
      expect(capture.templateTasks[0].title).toBe('X');
    });
  });
});
