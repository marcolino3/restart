import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberInput } from './dto/create-team-member.input';
import { UpdateTeamMemberInput } from './dto/update-team-member.input';

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
  ) {}

  async create(
    input: CreateTeamMemberInput,
    organizationId: string,
  ): Promise<TeamMember> {
    const existing = await this.teamMemberRepo.findOne({
      where: {
        organizationId,
        teamId: input.teamId,
        employeeId: input.employeeId,
      },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        return this.teamMemberRepo.save(existing);
      }
      throw new ConflictException(
        `Employee is already a member of this team`,
      );
    }

    const teamMember = this.teamMemberRepo.create({
      ...input,
      organizationId,
    });
    return this.teamMemberRepo.save(teamMember);
  }

  async findAllByOrgId(organizationId: string): Promise<TeamMember[]> {
    return this.teamMemberRepo.find({
      where: { organizationId, isActive: true },
      relations: ['team', 'employee'],
    });
  }

  async findAllByTeamId(
    teamId: string,
    organizationId: string,
  ): Promise<TeamMember[]> {
    return this.teamMemberRepo.find({
      where: { organizationId, teamId, isActive: true },
      relations: ['employee'],
    });
  }

  async findOne(id: string, organizationId: string): Promise<TeamMember> {
    const teamMember = await this.teamMemberRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['team', 'employee'],
    });
    if (!teamMember) {
      throw new NotFoundException(`TeamMember ${id} not found`);
    }
    return teamMember;
  }

  async update(
    input: UpdateTeamMemberInput,
    organizationId: string,
  ): Promise<TeamMember> {
    const teamMember = await this.findOne(input.id, organizationId);
    Object.assign(teamMember, input);
    return this.teamMemberRepo.save(teamMember);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const teamMember = await this.findOne(id, organizationId);
    teamMember.isActive = false;
    await this.teamMemberRepo.save(teamMember);
    return true;
  }
}
