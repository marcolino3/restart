import {
  BadRequestException,
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
    if (input.parentId) {
      await this.assertParentInOrg(input.parentId, organizationId);
    }

    const existing = await this.teamsRepo.findOne({
      where: { organizationId, name },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.parentId = input.parentId ?? null;
        return this.teamsRepo.save(existing);
      }
      throw new ConflictException(`Team "${name}" already exists`);
    }

    const team = this.teamsRepo.create({
      name,
      organizationId,
      parentId: input.parentId ?? null,
    });
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

    // Re-parenting: undefined = leave unchanged, null = make root.
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        team.parentId = null;
      } else {
        await this.assertParentInOrg(input.parentId, organizationId);
        await this.assertNoCycle(team.id, input.parentId, organizationId);
        team.parentId = input.parentId;
      }
    }

    return this.teamsRepo.save(team);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const team = await this.findOne(id, organizationId);
    // Keep the tree consistent: lift this team's children up to its own parent
    // (or to root) before soft-deleting it, so they don't dangle off an
    // inactive node.
    await this.teamsRepo.update(
      { parentId: id, organizationId },
      { parentId: team.parentId ?? null },
    );
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

  /** Parent must exist, be active and belong to the same organization. */
  private async assertParentInOrg(
    parentId: string,
    organizationId: string,
  ): Promise<void> {
    const parent = await this.teamsRepo.findOne({
      where: { id: parentId, organizationId, isActive: true },
    });
    if (!parent) {
      throw new NotFoundException(
        `Parent team ${parentId} not found in this organization`,
      );
    }
  }

  /**
   * Reject re-parenting that would create a cycle: a team may not become its
   * own descendant. Walks up from the candidate parent; if we reach the team
   * itself, the candidate is a descendant of the team → cycle.
   */
  private async assertNoCycle(
    teamId: string,
    candidateParentId: string,
    organizationId: string,
  ): Promise<void> {
    if (candidateParentId === teamId) {
      throw new BadRequestException('A team cannot be its own parent');
    }
    const visited = new Set<string>();
    let cursor: string | null | undefined = candidateParentId;
    while (cursor) {
      if (cursor === teamId) {
        throw new BadRequestException(
          'Cannot move a team underneath one of its own descendants',
        );
      }
      if (visited.has(cursor)) break; // guard against pre-existing bad data
      visited.add(cursor);
      const node: Pick<Team, 'parentId'> | null = await this.teamsRepo.findOne({
        where: { id: cursor, organizationId },
        select: ['parentId'],
      });
      cursor = node?.parentId ?? null;
    }
  }
}
