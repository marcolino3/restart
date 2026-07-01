import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { Project } from './entities/project.entity';
import { ProjectAccessService } from './project-access.service';
import { ProjectsService } from './projects.service';

const ORG = 'org-1';
const ME = 'membership-me';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepo: jest.Mocked<Pick<Repository<Project>, 'find'>>;
  let membershipsRepo: jest.Mocked<Pick<Repository<Membership>, 'find'>>;
  let access: jest.Mocked<Pick<ProjectAccessService, 'getMemberProjectIds'>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    projectsRepo = { find: jest.fn() };
    membershipsRepo = { find: jest.fn() };
    access = {
      getMemberProjectIds: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projectsRepo },
        { provide: getRepositoryToken(Membership), useValue: membershipsRepo },
        { provide: ProjectAccessService, useValue: access },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  describe('findVisible', () => {
    it('returns all active org projects for a canSeeAll caller', async () => {
      projectsRepo.find.mockResolvedValue([{ id: 'p1' } as Project]);

      await service.findVisible(ORG, ME, true);

      expect(access.getMemberProjectIds).not.toHaveBeenCalled();
      expect(projectsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG, isActive: true },
        }),
      );
    });

    it('scopes a normal caller to their member projects', async () => {
      access.getMemberProjectIds.mockResolvedValue(['p1']);
      projectsRepo.find.mockResolvedValue([{ id: 'p1' } as Project]);

      await service.findVisible(ORG, ME, false);

      expect(access.getMemberProjectIds).toHaveBeenCalledWith(ORG, ME);
      expect(projectsRepo.find).toHaveBeenCalled();
    });

    it('returns [] without querying projects when the caller has none', async () => {
      access.getMemberProjectIds.mockResolvedValue([]);

      const result = await service.findVisible(ORG, ME, false);

      expect(result).toEqual([]);
      expect(projectsRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('rejects members from another organization', async () => {
      membershipsRepo.find.mockResolvedValue([]); // none of the ids resolved

      await expect(
        service.create(
          { title: 'X', memberMembershipIds: ['foreign'] },
          ORG,
          ME,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('adds the creator as OWNER inside the transaction', async () => {
      const savedMembers: ProjectMember[] = [];
      const manager = {
        getRepository: (entity: unknown) => ({
          create: (d: unknown) => d,
          save: (d: unknown) => {
            if (entity === Project)
              return Promise.resolve({ ...(d as object), id: 'p-new' });
            if (entity === ProjectMember) {
              savedMembers.push(...(d as ProjectMember[]));
              return Promise.resolve(d);
            }
            return Promise.resolve(d);
          },
        }),
      };
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(manager),
      );

      const project = await service.create({ title: '  Board  ' }, ORG, ME);

      expect(project).toEqual(expect.objectContaining({ id: 'p-new' }));
      const owner = savedMembers.find((m) => m.membershipId === ME);
      expect(owner?.role).toBe(ProjectMemberRole.OWNER);
      expect(owner?.organizationId).toBe(ORG);
    });
  });
});
