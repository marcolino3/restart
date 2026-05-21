import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { ReorderTeamsInput } from './dto/reorder-teams.input';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
  ) {}

  async create(input: CreateTeamInput, organizationId: string): Promise<Team> {
    const name = input.name.trim();
    const existing = await this.teamsRepo.findOne({
      where: { organizationId, name },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        return this.teamsRepo.save(existing);
      }
      throw new ConflictException(`Team "${name}" already exists`);
    }

    const team = this.teamsRepo.create({ name, organizationId });
    return this.teamsRepo.save(team);
  }

  findAllByOrgId(organizationId: string): Promise<Team[]> {
    return this.teamsRepo.find({
      where: { organizationId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Team> {
    const team = await this.teamsRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    return team;
  }

  async update(input: UpdateTeamInput, organizationId: string): Promise<Team> {
    const team = await this.findOne(input.id, organizationId);
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name !== team.name) {
        const clash = await this.teamsRepo.findOne({
          where: { organizationId, name },
        });
        if (clash && clash.id !== team.id) {
          throw new ConflictException(`Team "${name}" already exists`);
        }
        team.name = name;
      }
    }
    return this.teamsRepo.save(team);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const team = await this.findOne(id, organizationId);
    team.isActive = false;
    await this.teamsRepo.save(team);
    return true;
  }

  async reorder(
    input: ReorderTeamsInput,
    organizationId: string,
  ): Promise<Team[]> {
    const teams = await this.teamsRepo.find({
      where: { id: In(input.ids), organizationId, isActive: true },
    });
    if (teams.length !== input.ids.length) {
      throw new NotFoundException(
        'One or more teams not found in this organization',
      );
    }
    const byId = new Map(teams.map((t) => [t.id, t]));
    const toSave = input.ids.map((id, index) => {
      const team = byId.get(id)!;
      team.sortOrder = index;
      return team;
    });
    await this.teamsRepo.save(toSave);
    return this.findAllByOrgId(organizationId);
  }
}
