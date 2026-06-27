import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  canSeeAllProjects,
  requireMembershipId,
} from '@/project-management/common/project-auth';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@Resolver(() => Project)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  // Projects the current user may see (member of, or all when PROJECT_MANAGE_ALL
  // / SuperAdmin). Visibility is enforced server-side, never just in the UI.
  @Query(() => [Project], { name: 'myProjects' })
  @Permissions('PROJECT_READ')
  myProjects(
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Project[]> {
    return this.projectsService.findVisible(
      orgId,
      requireMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Query(() => Project, { name: 'projectById' })
  @Permissions('PROJECT_READ')
  projectById(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Project> {
    return this.projectsService.findOne(
      id,
      orgId,
      requireMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Project)
  @Permissions('PROJECT_CREATE')
  createProject(
    @Args('input') input: CreateProjectInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Project> {
    return this.projectsService.create(input, orgId, requireMembershipId(user));
  }

  @Mutation(() => Project)
  @Permissions('PROJECT_READ')
  updateProject(
    @Args('input') input: UpdateProjectInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Project> {
    return this.projectsService.update(
      input,
      orgId,
      requireMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Project)
  @Permissions('PROJECT_READ')
  archiveProject(
    @Args('id', { type: () => ID }) id: string,
    @Args('archived', { type: () => Boolean, defaultValue: true })
    archived: boolean,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<Project> {
    return this.projectsService.setArchived(
      id,
      archived,
      orgId,
      requireMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Boolean)
  @Permissions('PROJECT_READ')
  deleteProject(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<boolean> {
    return this.projectsService.remove(
      id,
      orgId,
      requireMembershipId(user),
      canSeeAllProjects(user),
    );
  }
}
