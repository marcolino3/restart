import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { ProjectAccessService } from '@/project-management/projects/project-access.service';
import { TaskAssignee } from '@/project-management/tasks/entities/task-assignee.entity';
import { Task } from '@/project-management/tasks/entities/task.entity';
import { ProtocolParticipant } from './entities/protocol-participant.entity';
import { Protocol } from './entities/protocol.entity';
import { ProtocolsService } from './protocols.service';

const ORG = 'org-1';

type AnyMock = Record<string, jest.Mock>;

function makeManager(capture: {
  tasks: Task[];
  members: ProjectMember[];
  assignees: TaskAssignee[];
}) {
  const taskRepo = {
    create: (d: unknown) => d,
    save: (d: Task) => {
      capture.tasks.push(d);
      return Promise.resolve({ ...d, id: `task-${capture.tasks.length}` });
    },
    createQueryBuilder: () => {
      const qb = {
        select: () => qb,
        where: () => qb,
        andWhere: () => qb,
        getRawOne: () => Promise.resolve({ max: -1 }),
      };
      return qb;
    },
  };
  const memberRepo = {
    create: (d: unknown) => d,
    find: () => Promise.resolve([]), // no existing project members
    save: (d: ProjectMember[]) => {
      capture.members.push(...d);
      return Promise.resolve(d);
    },
  };
  const assigneeRepo = {
    create: (d: unknown) => d,
    save: (d: TaskAssignee[]) => {
      capture.assignees.push(...d);
      return Promise.resolve(d);
    },
  };
  return {
    getRepository: (entity: unknown) =>
      entity === Task
        ? taskRepo
        : entity === ProjectMember
          ? memberRepo
          : entity === TaskAssignee
            ? assigneeRepo
            : {
                create: (d: unknown) => d,
                save: (d: unknown) => Promise.resolve(d),
              },
  };
}

describe('ProtocolsService', () => {
  let service: ProtocolsService;
  let protocolsRepo: AnyMock;
  let membershipsRepo: AnyMock;
  let access: { assertCanView: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    protocolsRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
    membershipsRepo = { find: jest.fn() };
    access = { assertCanView: jest.fn().mockResolvedValue({ id: 'p1' }) };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProtocolsService,
        { provide: getRepositoryToken(Protocol), useValue: protocolsRepo },
        {
          provide: getRepositoryToken(ProtocolParticipant),
          useValue: { delete: jest.fn(), save: jest.fn() },
        },
        { provide: getRepositoryToken(Membership), useValue: membershipsRepo },
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: { find: jest.fn(), save: jest.fn() },
        },
        { provide: ProjectAccessService, useValue: access },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ProtocolsService);
  });

  it('findAll scopes protocols to the active organization', async () => {
    protocolsRepo.find.mockResolvedValue([]);
    await service.findAll(ORG);
    expect(protocolsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isActive: true },
      }),
    );
  });

  describe('createTasksFromProtocol', () => {
    it('creates a task per todo with protocol ref + assignee (My Tasks), and auto-adds the assignee to the linked project', async () => {
      protocolsRepo.findOne.mockResolvedValue({
        id: 'proto1',
        projectId: 'p1',
        organizationId: ORG,
        createdByMembershipId: 'creator',
        isActive: true,
      });
      membershipsRepo.find.mockResolvedValue([{ id: 'm1' }]);
      const capture = {
        tasks: [] as Task[],
        members: [] as ProjectMember[],
        assignees: [] as TaskAssignee[],
      };
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(makeManager(capture)),
      );

      await service.createTasksFromProtocol(
        {
          protocolId: 'proto1',
          tasks: [{ title: 'Blumen bestellen', assigneeMembershipIds: ['m1'] }],
        },
        ORG,
      );

      // Task carries the protocol back-reference and lands on the project board.
      expect(capture.tasks).toHaveLength(1);
      expect(capture.tasks[0].protocolId).toBe('proto1');
      expect(capture.tasks[0].projectId).toBe('p1');
      // Assignee row exists → shows up in that member's "My Tasks".
      expect(capture.assignees[0].membershipId).toBe('m1');
      // Assignee auto-added as project member so the board invariant holds.
      expect(capture.members[0]).toEqual(
        expect.objectContaining({
          membershipId: 'm1',
          projectId: 'p1',
          role: ProjectMemberRole.MEMBER,
        }),
      );
    });

    it('rejects assignees from another organization', async () => {
      protocolsRepo.findOne.mockResolvedValue({
        id: 'proto1',
        projectId: null,
        organizationId: ORG,
        isActive: true,
      });
      membershipsRepo.find.mockResolvedValue([]); // foreign assignee not found

      await expect(
        service.createTasksFromProtocol(
          {
            protocolId: 'proto1',
            tasks: [{ title: 'X', assigneeMembershipIds: ['foreign'] }],
          },
          ORG,
        ),
      ).rejects.toThrow();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('checks project visibility when linking the protocol to a project', async () => {
      membershipsRepo.find.mockResolvedValue([]);
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(makeManager({ tasks: [], members: [], assignees: [] })),
      );

      await service.create(
        { title: 'Primarsitzung', projectId: 'p1' },
        ORG,
        'me',
        false,
      );

      expect(access.assertCanView).toHaveBeenCalledWith(ORG, 'p1', 'me', false);
    });
  });
});
