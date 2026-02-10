import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TeamMembersService } from './team-members.service';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberInput } from './dto/create-team-member.input';
import { UpdateTeamMemberInput } from './dto/update-team-member.input';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';

@Resolver(() => TeamMember)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class TeamMembersResolver {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Mutation(() => TeamMember)
  @Permissions('TEAM_MANAGE')
  createTeamMember(@Args('createTeamMemberInput') createTeamMemberInput: CreateTeamMemberInput) {
    return this.teamMembersService.create(createTeamMemberInput);
  }

  @Query(() => [TeamMember], { name: 'teamMembers' })
  @Permissions('TEAM_MANAGE')
  findAll() {
    return this.teamMembersService.findAll();
  }

  @Query(() => TeamMember, { name: 'teamMember' })
  @Permissions('TEAM_MANAGE')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.teamMembersService.findOne(id);
  }

  @Mutation(() => TeamMember)
  @Permissions('TEAM_MANAGE')
  updateTeamMember(@Args('updateTeamMemberInput') updateTeamMemberInput: UpdateTeamMemberInput) {
    return this.teamMembersService.update(updateTeamMemberInput.id, updateTeamMemberInput);
  }

  @Mutation(() => TeamMember)
  @Permissions('TEAM_MANAGE')
  removeTeamMember(@Args('id', { type: () => Int }) id: number) {
    return this.teamMembersService.remove(id);
  }
}
