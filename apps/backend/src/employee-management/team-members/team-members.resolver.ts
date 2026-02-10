import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TeamMembersService } from './team-members.service';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberInput } from './dto/create-team-member.input';
import { UpdateTeamMemberInput } from './dto/update-team-member.input';

@Resolver(() => TeamMember)
export class TeamMembersResolver {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Mutation(() => TeamMember)
  createTeamMember(@Args('createTeamMemberInput') createTeamMemberInput: CreateTeamMemberInput) {
    return this.teamMembersService.create(createTeamMemberInput);
  }

  @Query(() => [TeamMember], { name: 'teamMembers' })
  findAll() {
    return this.teamMembersService.findAll();
  }

  @Query(() => TeamMember, { name: 'teamMember' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.teamMembersService.findOne(id);
  }

  @Mutation(() => TeamMember)
  updateTeamMember(@Args('updateTeamMemberInput') updateTeamMemberInput: UpdateTeamMemberInput) {
    return this.teamMembersService.update(updateTeamMemberInput.id, updateTeamMemberInput);
  }

  @Mutation(() => TeamMember)
  removeTeamMember(@Args('id', { type: () => Int }) id: number) {
    return this.teamMembersService.remove(id);
  }
}
