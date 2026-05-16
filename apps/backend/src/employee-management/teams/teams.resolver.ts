import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { ReorderTeamsInput } from './dto/reorder-teams.input';

@Resolver(() => Team)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  @Query(() => [Team], { name: 'teamsByOrgId' })
  @Permissions('TEAM_MANAGE')
  findAll(@CurrentOrgId() orgId: string) {
    return this.teamsService.findAllByOrgId(orgId);
  }

  @Query(() => Team, { name: 'teamById' })
  @Permissions('TEAM_MANAGE')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamsService.findOne(id, orgId);
  }

  @Mutation(() => Team)
  @Permissions('TEAM_CREATE')
  createTeam(
    @Args('input') input: CreateTeamInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamsService.create(input, orgId);
  }

  @Mutation(() => Team)
  @Permissions('TEAM_MANAGE')
  updateTeam(
    @Args('input') input: UpdateTeamInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('TEAM_DELETE')
  deleteTeam(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamsService.remove(id, orgId);
  }

  @Mutation(() => [Team])
  @Permissions('TEAM_MANAGE')
  reorderTeams(
    @Args('input') input: ReorderTeamsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.teamsService.reorder(input, orgId);
  }
}
