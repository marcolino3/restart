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
import { applyScalarUpdate } from '@/database/apply-scalar-update';

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
        if (input.role) existing.role = input.role;
        return this.teamMemberRepo.save(existing);
      }
      throw new ConflictException(`Employee is already a member of this team`);
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
      // Employee.membership is a non-nullable GraphQL field, so the nested
      // membership -> user -> userEmails chain must be eagerly loaded or the
      // query fails with "Cannot return null for non-nullable field".
      relations: {
        team: true,
        employee: { membership: { user: { userEmails: true } } },
      },
    });
  }

  async findAllByTeamId(
    teamId: string,
    organizationId: string,
  ): Promise<TeamMember[]> {
    return this.teamMemberRepo.find({
      where: { organizationId, teamId, isActive: true },
      relations: {
        employee: { membership: { user: { userEmails: true } } },
      },
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
    const { id: _id, ...patch } = input;
    // Load WITHOUT the `team`/`employee` relations so assigned `teamId`/
    // `employeeId` win on save (loaded relation objects would silently revert
    // the FK changes). Stays org-scoped for multi-tenant isolation.
    return applyScalarUpdate<TeamMember>(
      this.teamMemberRepo,
      { id: input.id, organizationId, isActive: true },
      patch,
    );
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const teamMember = await this.findOne(id, organizationId);
    teamMember.isActive = false;
    await this.teamMemberRepo.save(teamMember);
    return true;
  }
}
