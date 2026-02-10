import { Injectable } from '@nestjs/common';
import { CreateTeamMemberInput } from './dto/create-team-member.input';
import { UpdateTeamMemberInput } from './dto/update-team-member.input';

@Injectable()
export class TeamMembersService {
  create(_createTeamMemberInput: CreateTeamMemberInput) {
    return 'This action adds a new teamMember';
  }

  findAll() {
    return `This action returns all teamMembers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} teamMember`;
  }

  update(id: number, _updateTeamMemberInput: UpdateTeamMemberInput) {
    return `This action updates a #${id} teamMember`;
  }

  remove(id: number) {
    return `This action removes a #${id} teamMember`;
  }
}
