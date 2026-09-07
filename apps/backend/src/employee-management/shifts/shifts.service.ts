import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { Shift } from './entities/shift.entity';
import { TeamShift } from './entities/team-shift.entity';
import { CreateShiftInput } from './dto/create-shift.input';
import { UpdateShiftInput } from './dto/update-shift.input';
import { SetTeamShiftsInput } from './dto/set-team-shifts.input';

/** Postgres `time` comes back as `HH:MM:SS`; the API speaks `HH:MM`. */
export const toHHMM = (value: string): string => value.slice(0, 5);

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(TeamShift)
    private readonly teamShiftsRepo: Repository<TeamShift>,
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
  ) {}

  async findAll(organizationId: string): Promise<Shift[]> {
    const shifts = await this.shiftsRepo.find({
      where: { organizationId, isActive: true },
      order: { sortOrder: 'ASC', startTime: 'ASC', name: 'ASC' },
    });
    return shifts.map((s) => this.normalize(s));
  }

  async findOne(id: string, organizationId: string): Promise<Shift> {
    const shift = await this.shiftsRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    return this.normalize(shift);
  }

  async create(
    input: CreateShiftInput,
    organizationId: string,
  ): Promise<Shift> {
    const name = input.name.trim();
    const existing = await this.shiftsRepo.findOne({
      where: { organizationId, name },
    });
    if (existing) {
      if (!existing.isActive) {
        // Re-activate a soft-deleted shift of the same name instead of
        // tripping over the unique index.
        Object.assign(existing, this.toColumns(input), {
          name,
          isActive: true,
        });
        return this.normalize(await this.shiftsRepo.save(existing));
      }
      throw new ConflictException(`Shift "${name}" already exists`);
    }

    const shift = this.shiftsRepo.create({
      ...this.toColumns(input),
      name,
      organizationId,
      sortOrder: input.sortOrder ?? (await this.nextSortOrder(organizationId)),
    });
    return this.normalize(await this.shiftsRepo.save(shift));
  }

  async update(
    input: UpdateShiftInput,
    organizationId: string,
  ): Promise<Shift> {
    const shift = await this.findOne(input.id, organizationId);

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name !== shift.name) {
        const clash = await this.shiftsRepo.findOne({
          where: { organizationId, name },
        });
        if (clash && clash.id !== shift.id) {
          throw new ConflictException(`Shift "${name}" already exists`);
        }
        shift.name = name;
      }
    }
    Object.assign(shift, this.toColumns(input));
    if (input.sortOrder !== undefined) shift.sortOrder = input.sortOrder;

    return this.normalize(await this.shiftsRepo.save(shift));
  }

  /** Soft delete; team assignments are removed so the shift disappears from planning. */
  async remove(id: string, organizationId: string): Promise<boolean> {
    const shift = await this.findOne(id, organizationId);
    shift.isActive = false;
    await this.shiftsRepo.save(shift);
    await this.teamShiftsRepo.delete({ shiftId: id, organizationId });
    return true;
  }

  /** Shifts a team works, in shift order. */
  async findForTeam(teamId: string, organizationId: string): Promise<Shift[]> {
    await this.assertTeamInOrg(teamId, organizationId);
    const rows = await this.teamShiftsRepo.find({
      where: { teamId, organizationId },
      relations: { shift: true },
    });
    return rows
      .map((r) => r.shift)
      .filter((s): s is Shift => !!s && s.isActive)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.startTime.localeCompare(b.startTime) ||
          a.name.localeCompare(b.name),
      )
      .map((s) => this.normalize(s));
  }

  /** Team ids (of this org) assigned to each of the given shifts. */
  async teamIdsByShift(
    shiftIds: string[],
    organizationId: string,
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>(shiftIds.map((id) => [id, []]));
    if (shiftIds.length === 0) return map;
    const rows = await this.teamShiftsRepo.find({
      where: { shiftId: In(shiftIds), organizationId },
    });
    for (const row of rows) map.get(row.shiftId)?.push(row.teamId);
    return map;
  }

  /** Full replacement of a team's shift set. Both sides must belong to the org. */
  async setTeamShifts(
    input: SetTeamShiftsInput,
    organizationId: string,
  ): Promise<Shift[]> {
    await this.assertTeamInOrg(input.teamId, organizationId);
    const wanted = Array.from(new Set(input.shiftIds));

    if (wanted.length > 0) {
      const found = await this.shiftsRepo.count({
        where: { id: In(wanted), organizationId, isActive: true },
      });
      if (found !== wanted.length) {
        throw new NotFoundException(
          'One or more shifts not found in this organization',
        );
      }
    }

    const current = await this.teamShiftsRepo.find({
      where: { teamId: input.teamId, organizationId },
    });
    const currentIds = new Set(current.map((r) => r.shiftId));
    const toRemove = current.filter((r) => !wanted.includes(r.shiftId));
    const toAdd = wanted.filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      await this.teamShiftsRepo.delete({
        id: In(toRemove.map((r) => r.id)),
        organizationId,
      });
    }
    if (toAdd.length > 0) {
      await this.teamShiftsRepo.save(
        toAdd.map((shiftId) =>
          this.teamShiftsRepo.create({
            teamId: input.teamId,
            shiftId,
            organizationId,
          }),
        ),
      );
    }
    return this.findForTeam(input.teamId, organizationId);
  }

  private async assertTeamInOrg(
    teamId: string,
    organizationId: string,
  ): Promise<void> {
    const team = await this.teamsRepo.findOne({
      where: { id: teamId, organizationId, isActive: true },
    });
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);
  }

  private async nextSortOrder(organizationId: string): Promise<number> {
    const last = await this.shiftsRepo.findOne({
      where: { organizationId },
      order: { sortOrder: 'DESC' },
    });
    return last ? last.sortOrder + 1 : 0;
  }

  private toColumns(
    input: Partial<CreateShiftInput>,
  ): Partial<Pick<Shift, 'startTime' | 'endTime' | 'color'>> {
    const out: Partial<Pick<Shift, 'startTime' | 'endTime' | 'color'>> = {};
    if (input.startTime !== undefined) out.startTime = input.startTime;
    if (input.endTime !== undefined) out.endTime = input.endTime;
    if (input.color !== undefined) out.color = input.color ?? null;
    return out;
  }

  private normalize(shift: Shift): Shift {
    shift.startTime = toHHMM(shift.startTime);
    shift.endTime = toHHMM(shift.endTime);
    return shift;
  }
}
