import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';

@Resolver(() => Team)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  @Mutation(() => Team)
  @Permissions('TEAM_CREATE')
  createTeam(@Args('createTeamInput') createTeamInput: CreateTeamInput) {
    return this.teamsService.create(createTeamInput);
  }

  @Query(() => [Team], { name: 'teams' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Query(() => Team, { name: 'team' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.teamsService.findOne(id);
  }

  @Mutation(() => Team)
  @Permissions('TEAM_MANAGE')
  updateTeam(@Args('updateTeamInput') updateTeamInput: UpdateTeamInput) {
    return this.teamsService.update(updateTeamInput.id, updateTeamInput);
  }

  @Mutation(() => Team)
  @Permissions('TEAM_DELETE')
  removeTeam(@Args('id', { type: () => Int }) id: number) {
    return this.teamsService.remove(id);
  }
}
