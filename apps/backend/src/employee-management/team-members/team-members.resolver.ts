import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { TeamMembersService } from './team-members.service';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberInput } from './dto/create-team-member.input';
import { UpdateTeamMemberInput } from './dto/update-team-member.input';

@Resolver(() => TeamMember)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TeamMembersResolver {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Query(() => [TeamMember], { name: 'teamMembersByOrgId' })
  @Permissions('TEAM_MANAGE')
  findAll(@CurrentOrgId() orgId: string) {
    return this.teamMembersService.findAllByOrgId(orgId);
  }

  @Query(() => [TeamMember], { name: 'teamMembersByTeamId' })
  @Permissions('TEAM_MANAGE')
  findAllByTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamMembersService.findAllByTeamId(teamId, orgId);
  }

  @Query(() => TeamMember, { name: 'teamMemberById' })
  @Permissions('TEAM_MANAGE')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamMembersService.findOne(id, orgId);
  }

  @Mutation(() => TeamMember)
  @Permissions('TEAM_MANAGE')
  createTeamMember(
    @Args('input') input: CreateTeamMemberInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamMembersService.create(input, orgId);
  }

  @Mutation(() => TeamMember)
  @Permissions('TEAM_MANAGE')
  updateTeamMember(
    @Args('input') input: UpdateTeamMemberInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamMembersService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('TEAM_MANAGE')
  deleteTeamMember(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamMembersService.remove(id, orgId);
  }
}
