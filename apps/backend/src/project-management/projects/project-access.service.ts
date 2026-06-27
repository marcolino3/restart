import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '@/project-management/project-members/entities/project-member.entity';
import { ProjectMemberRole } from '@/project-management/project-members/entities/project-member-role.enum';
import { Project } from './entities/project.entity';

/**
 * Central enforcement point for project visibility and in-project authorization.
 *
 * Visibility rule (server-side, not just UI): a project is only visible to its
 * members. A non-member must not be able to learn that a project exists — not
 * via lists, not via a direct id. We therefore raise NotFound (never Forbidden)
 * for non-members, so the response is indistinguishable from a missing project.
 *
 * Exception: callers with the org-wide override (`canSeeAll`) — holders of the
 * PROJECT_MANAGE_ALL permission and platform SuperAdmins — see and manage every
 * project in their organization. Their privilege is resolved in the resolver
 * and passed in explicitly; this service never reads the auth context itself.
 */
@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
  ) {}

  /** Project ids the membership is an (active) member of, within the org. */
  async getMemberProjectIds(
    organizationId: string,
    membershipId: string | null,
  ): Promise<string[]> {
    // No membership → no member projects. Guard against a null/undefined slipping
    // into the WHERE clause (TypeORM would drop the filter and leak everything).
    if (!membershipId) return [];
    const rows = await this.membersRepo.find({
      where: { organizationId, membershipId, isActive: true },
      select: ['projectId'],
    });
    return rows.map((r) => r.projectId);
  }

  /** The membership's role in a project, or null if they are not a member. */
  async getProjectRole(
    organizationId: string,
    projectId: string,
    membershipId: string | null,
  ): Promise<ProjectMemberRole | null> {
    if (!membershipId) return null;
    const member = await this.membersRepo.findOne({
      where: { organizationId, projectId, membershipId, isActive: true },
      select: ['role'],
    });
    return member?.role ?? null;
  }

  /**
   * Load a project the caller is allowed to *see*. Members and `canSeeAll`
   * callers pass; everyone else gets NotFound (no existence leak).
   */
  async assertCanView(
    organizationId: string,
    projectId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Project> {
    const project = await this.loadActiveProject(organizationId, projectId);
    if (canSeeAll) return project;
    const role = await this.getProjectRole(
      organizationId,
      projectId,
      membershipId,
    );
    if (!role) throw this.notFound(projectId);
    return project;
  }

  /**
   * Authorize editing a project's tasks: any member (OWNER or MEMBER) or a
   * `canSeeAll` caller. Non-members get NotFound (no existence leak).
   */
  async assertCanEditTasks(
    organizationId: string,
    projectId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Project> {
    const project = await this.loadActiveProject(organizationId, projectId);
    if (canSeeAll) return project;
    const role = await this.getProjectRole(
      organizationId,
      projectId,
      membershipId,
    );
    if (!role) throw this.notFound(projectId);
    return project;
  }

  /**
   * Authorize managing a project (settings, members, delete): OWNER or a
   * `canSeeAll` caller. Non-members get NotFound; a non-owner member who can see
   * the project gets Forbidden.
   */
  async assertCanManage(
    organizationId: string,
    projectId: string,
    membershipId: string | null,
    canSeeAll: boolean,
  ): Promise<Project> {
    const project = await this.loadActiveProject(organizationId, projectId);
    if (canSeeAll) return project;
    const role = await this.getProjectRole(
      organizationId,
      projectId,
      membershipId,
    );
    if (!role) throw this.notFound(projectId);
    if (role !== ProjectMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only a project owner can manage this project',
      );
    }
    return project;
  }

  private async loadActiveProject(
    organizationId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id: projectId, organizationId, isActive: true },
    });
    if (!project) throw this.notFound(projectId);
    return project;
  }

  private notFound(projectId: string): NotFoundException {
    return new NotFoundException(`Project ${projectId} not found`);
  }
}
