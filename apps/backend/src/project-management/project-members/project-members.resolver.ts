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
  actingMembershipId,
} from '@/project-management/common/project-auth';
import { AddProjectMemberInput } from './dto/add-project-member.input';
import { UpdateProjectMemberRoleInput } from './dto/update-project-member-role.input';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectMembersService } from './project-members.service';

@Resolver(() => ProjectMember)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ProjectMembersResolver {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Query(() => [ProjectMember], { name: 'projectMembers' })
  @Permissions('PROJECT_READ')
  projectMembers(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProjectMember[]> {
    return this.membersService.findByProject(
      projectId,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => ProjectMember)
  @Permissions('PROJECT_READ')
  addProjectMember(
    @Args('input') input: AddProjectMemberInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProjectMember> {
    return this.membersService.add(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => ProjectMember)
  @Permissions('PROJECT_READ')
  updateProjectMemberRole(
    @Args('input') input: UpdateProjectMemberRoleInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<ProjectMember> {
    return this.membersService.updateRole(
      input,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }

  @Mutation(() => Boolean)
  @Permissions('PROJECT_READ')
  removeProjectMember(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<boolean> {
    return this.membersService.remove(
      id,
      orgId,
      actingMembershipId(user),
      canSeeAllProjects(user),
    );
  }
}
