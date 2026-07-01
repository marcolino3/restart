import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { Project } from './entities/project.entity';
import { ProjectAccessService } from './project-access.service';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';
const PROJECT = 'project-1';
const ME = 'membership-me';

describe('ProjectAccessService', () => {
  let service: ProjectAccessService;
  let projectsRepo: jest.Mocked<Pick<Repository<Project>, 'findOne' | 'find'>>;
  let membersRepo: jest.Mocked<
    Pick<Repository<ProjectMember>, 'findOne' | 'find'>
  >;

  beforeEach(async () => {
    projectsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    membersRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAccessService,
        { provide: getRepositoryToken(Project), useValue: projectsRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
      ],
    }).compile();

    service = module.get(ProjectAccessService);
  });

  describe('getMemberProjectIds', () => {
    it('scopes the lookup to the org + membership + active rows', async () => {
      membersRepo.find.mockResolvedValue([
        { projectId: 'p1' } as ProjectMember,
        { projectId: 'p2' } as ProjectMember,
      ]);

      const ids = await service.getMemberProjectIds(ORG, ME);

      expect(ids).toEqual(['p1', 'p2']);
      expect(membersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG, membershipId: ME, isActive: true },
          select: ['projectId'],
        }),
      );
    });
  });

  describe('assertCanView', () => {
    it('throws NotFound when the project is not in the org', async () => {
      projectsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertCanView(ORG, PROJECT, ME, false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides the project from a non-member (NotFound, no existence leak)', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);
      membersRepo.findOne.mockResolvedValue(null); // not a member

      await expect(
        service.assertCanView(ORG, PROJECT, ME, false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows a member', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);
      membersRepo.findOne.mockResolvedValue({
        role: ProjectMemberRole.MEMBER,
      } as ProjectMember);

      await expect(
        service.assertCanView(ORG, PROJECT, ME, false),
      ).resolves.toEqual({ id: PROJECT });
    });

    it('allows a canSeeAll caller without checking membership', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);

      await expect(
        service.assertCanView(ORG, PROJECT, ME, true),
      ).resolves.toEqual({ id: PROJECT });
      expect(membersRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('assertCanManage', () => {
    it('hides the project from a non-member (NotFound)', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);
      membersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertCanManage(ORG, PROJECT, ME, false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a non-owner member', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);
      membersRepo.findOne.mockResolvedValue({
        role: ProjectMemberRole.MEMBER,
      } as ProjectMember);

      await expect(
        service.assertCanManage(ORG, PROJECT, ME, false),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an owner', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);
      membersRepo.findOne.mockResolvedValue({
        role: ProjectMemberRole.OWNER,
      } as ProjectMember);

      await expect(
        service.assertCanManage(ORG, PROJECT, ME, false),
      ).resolves.toEqual({ id: PROJECT });
    });

    it('allows a canSeeAll caller', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: PROJECT } as Project);

      await expect(
        service.assertCanManage(ORG, PROJECT, ME, true),
      ).resolves.toEqual({ id: PROJECT });
      expect(membersRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('cross-tenant isolation', () => {
    it('scopes the project lookup to the given organization', async () => {
      projectsRepo.findOne.mockResolvedValue(null);

      await service
        .assertCanView(OTHER_ORG, PROJECT, ME, true)
        .catch(() => undefined);

      expect(projectsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROJECT, organizationId: OTHER_ORG, isActive: true },
        }),
      );
    });
  });
});
