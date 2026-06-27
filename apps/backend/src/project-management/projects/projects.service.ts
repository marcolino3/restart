import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { Project } from './entities/project.entity';
import { ProjectAccessService } from './project-access.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    private readonly access: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a project. The creator is always added as an OWNER member; any
   * additional memberships are added as MEMBERs. Done in one transaction so a
   * project never exists without its owner.
   */
  async create(
    input: CreateProjectInput,
    organizationId: string,
    creatorMembershipId: string,
  ): Promise<Project> {
    const extraIds = await this.validateMembershipsInOrg(
      input.memberMembershipIds ?? [],
      organizationId,
    );

    return this.dataSource.transaction(async (manager) => {
      const project = await manager.getRepository(Project).save(
        manager.getRepository(Project).create({
          title: input.title.trim(),
          description: input.description ?? null,
          status: input.status,
          color: input.color ?? null,
          organizationId,
          createdByMembershipId: creatorMembershipId,
        }),
      );

      // Creator first (OWNER), then the rest (MEMBER) — deduped, creator wins.
      const memberIds = new Set(extraIds);
      memberIds.delete(creatorMembershipId);
      const members = [
        manager.getRepository(ProjectMember).create({
          organizationId,
          projectId: project.id,
          membershipId: creatorMembershipId,
          role: ProjectMemberRole.OWNER,
        }),
        ...[...memberIds].map((membershipId) =>
          manager.getRepository(ProjectMember).create({
            organizationId,
            projectId: project.id,
            membershipId,
            role: ProjectMemberRole.MEMBER,
          }),
        ),
      ];
      await manager.getRepository(ProjectMember).save(members);

      return project;
    });
  }

  /**
   * Projects the caller may see: the ones they are a member of, or — for
   * `canSeeAll` callers — every project in the organization.
   */
  async findVisible(
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Project[]> {
    if (canSeeAll) {
      return this.projectsRepo.find({
        where: { organizationId, isActive: true },
        order: { createdAt: 'DESC' },
      });
    }

    const projectIds = await this.access.getMemberProjectIds(
      organizationId,
      membershipId,
    );
    if (projectIds.length === 0) return [];

    return this.projectsRepo.find({
      where: { id: In(projectIds), organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** A single project with its members loaded, visibility enforced. */
  async findOne(
    id: string,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Project> {
    await this.access.assertCanView(
      organizationId,
      id,
      membershipId,
      canSeeAll,
    );
    return this.projectsRepo.findOneOrFail({
      where: { id, organizationId, isActive: true },
      relations: { members: { membership: { user: true } } },
    });
  }

  async update(
    input: UpdateProjectInput,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Project> {
    const project = await this.access.assertCanManage(
      organizationId,
      input.id,
      membershipId,
      canSeeAll,
    );

    if (input.title !== undefined) project.title = input.title.trim();
    if (input.description !== undefined)
      project.description = input.description ?? null;
    if (input.status !== undefined) project.status = input.status;
    if (input.color !== undefined) project.color = input.color ?? null;

    return this.projectsRepo.save(project);
  }

  async setArchived(
    id: string,
    archived: boolean,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<Project> {
    const project = await this.access.assertCanManage(
      organizationId,
      id,
      membershipId,
      canSeeAll,
    );
    project.isArchived = archived;
    return this.projectsRepo.save(project);
  }

  async remove(
    id: string,
    organizationId: string,
    membershipId: string,
    canSeeAll: boolean,
  ): Promise<boolean> {
    const project = await this.access.assertCanManage(
      organizationId,
      id,
      membershipId,
      canSeeAll,
    );
    project.isActive = false;
    await this.projectsRepo.save(project);
    return true;
  }

  /**
   * Ensure every id is a membership of the active org. Returns the deduped ids.
   * Guards against assigning members from another tenant.
   */
  private async validateMembershipsInOrg(
    membershipIds: string[],
    organizationId: string,
  ): Promise<string[]> {
    const unique = [...new Set(membershipIds)];
    if (unique.length === 0) return [];

    const found = await this.membershipsRepo.find({
      where: { id: In(unique), organizationId },
      select: ['id'],
    });
    if (found.length !== unique.length) {
      throw new BadRequestException(
        'One or more memberships do not belong to this organization',
      );
    }
    return unique;
  }
}
