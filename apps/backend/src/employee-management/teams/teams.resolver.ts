import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { TeamsService } from './teams.service';
import { TeamAccessService } from './team-access.service';
import { Team } from './entities/team.entity';
import { AccessibleTeam } from './dto/accessible-team.output';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { ReorderTeamsInput } from './dto/reorder-teams.input';

@Resolver(() => Team)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TeamsResolver {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamAccessService: TeamAccessService,
  ) {}

  // The teams the current user belongs to or leads, with the role that applies
  // after downward inheritance through the hierarchy. Available to any
  // authenticated org member — it only ever exposes the caller's own access.
  @Query(() => [AccessibleTeam], { name: 'myTeams' })
  async myTeams(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<AccessibleTeam[]> {
    if (!user?.membershipId) {
      throw new ForbiddenException('No active membership');
    }
    return this.teamAccessService.getAccessibleTeamsForMembership(
      orgId,
      user.membershipId,
    );
  }

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
