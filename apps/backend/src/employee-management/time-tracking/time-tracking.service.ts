import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import {
  TimeTracking,
  TimeTrackingSource,
} from './entities/time-tracking.entity';
import { CreateTimeTrackingInput } from './dto/create-time-tracking.input';
import { UpdateTimeTrackingInput } from './dto/update-time-tracking.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

/** 'YYYY-MM-DD' (lokaler Kalendertag) aus einem Date. */
function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Netto-Arbeitsminuten (ended - started - break); null solange offen. */
function computeWorkMinutes(
  startedAt: Date,
  endedAt?: Date | null,
  breakMinutes?: number | null,
): number | null {
  if (!endedAt) return null;
  const gross = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
  return Math.max(0, gross - (breakMinutes ?? 0));
}

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeTracking)
    private readonly timeTrackingRepo: Repository<TimeTracking>,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly access: TimeTrackingAccessService,
  ) {}

  async create(
    input: CreateTimeTrackingInput,
    organizationId: string,
    user: TokenPayload,
  ): Promise<TimeTracking> {
    await this.access.assertCanManageEmployee(user, input.employeeId);
    const startedAt = new Date(input.startedAt);
    const endedAt = input.endedAt ? new Date(input.endedAt) : undefined;
    const entry = this.timeTrackingRepo.create({
      ...input,
      startedAt,
      endedAt,
      entryDate: toDateString(startedAt),
      workMinutes: computeWorkMinutes(startedAt, endedAt, input.breakMinutes),
      source: TimeTrackingSource.MANUAL,
      organizationId,
    });
    const saved = await this.timeTrackingRepo.save(entry);
    await this.recompute(saved);
    return saved;
  }

  /** Ledger für den betroffenen Tag des Eintrags neu berechnen. */
  private async recompute(entry: TimeTracking): Promise<void> {
    await this.balanceRecompute.recomputeRange(
      entry.organizationId,
      entry.employeeId,
      entry.entryDate,
      entry.entryDate,
    );
  }

  async start(
    employeeId: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<TimeTracking> {
    await this.access.assertCanManageEmployee(user, employeeId);
    const openEntry = await this.timeTrackingRepo.findOne({
      where: {
        organizationId,
        employeeId,
        endedAt: IsNull(),
        isActive: true,
      },
    });
    if (openEntry) {
      throw new BadRequestException(
        'An open time tracking entry already exists for this employee',
      );
    }

    const now = new Date();
    const entry = this.timeTrackingRepo.create({
      organizationId,
      employeeId,
      startedAt: now,
      entryDate: toDateString(now),
      source: TimeTrackingSource.CLOCK,
    });
    return this.timeTrackingRepo.save(entry);
  }

  async stop(
    employeeId: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<TimeTracking> {
    await this.access.assertCanManageEmployee(user, employeeId);
    const openEntry = await this.timeTrackingRepo.findOne({
      where: {
        organizationId,
        employeeId,
        endedAt: IsNull(),
        isActive: true,
      },
    });
    if (!openEntry) {
      throw new NotFoundException(
        'No open time tracking entry found for this employee',
      );
    }
    openEntry.endedAt = new Date();
    openEntry.workMinutes = computeWorkMinutes(
      openEntry.startedAt,
      openEntry.endedAt,
      openEntry.breakMinutes,
    );
    const saved = await this.timeTrackingRepo.save(openEntry);
    await this.recompute(saved);
    return saved;
  }

  async findAllByEmployeeId(
    employeeId: string,
    organizationId: string,
    user: TokenPayload,
    from?: Date,
    to?: Date,
  ): Promise<TimeTracking[]> {
    await this.access.assertCanViewEmployee(user, employeeId);
    return this.timeTrackingRepo.find({
      where: {
        organizationId,
        employeeId,
        isActive: true,
        ...(from && to ? { startedAt: Between(from, to) } : {}),
      },
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
    user?: TokenPayload,
  ): Promise<TimeTracking> {
    const entry = await this.timeTrackingRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['employee'],
    });
    if (!entry) {
      throw new NotFoundException(`TimeTracking entry ${id} not found`);
    }
    if (user) await this.access.assertCanViewEmployee(user, entry.employeeId);
    return entry;
  }

  async update(
    input: UpdateTimeTrackingInput,
    organizationId: string,
    user: TokenPayload,
  ): Promise<TimeTracking> {
    const entry = await this.findOne(input.id, organizationId);
    await this.access.assertCanManageEmployee(user, entry.employeeId);
    const previousEntryDate = entry.entryDate;
    const { startedAt, endedAt, ...rest } = input;
    Object.assign(entry, rest);
    if (startedAt) {
      entry.startedAt = new Date(startedAt);
      entry.entryDate = toDateString(entry.startedAt);
    }
    if (endedAt !== undefined) {
      entry.endedAt = endedAt ? new Date(endedAt) : undefined;
    }
    entry.workMinutes = computeWorkMinutes(
      entry.startedAt,
      entry.endedAt,
      entry.breakMinutes,
    );
    const saved = await this.timeTrackingRepo.save(entry);
    // Falls der Tag verschoben wurde, beide betroffenen Bereiche neu rechnen.
    const from =
      previousEntryDate < saved.entryDate ? previousEntryDate : saved.entryDate;
    const to =
      previousEntryDate > saved.entryDate ? previousEntryDate : saved.entryDate;
    await this.balanceRecompute.recomputeRange(
      organizationId,
      saved.employeeId,
      from,
      to,
    );
    return saved;
  }

  async remove(
    id: string,
    organizationId: string,
    user: TokenPayload,
  ): Promise<boolean> {
    const entry = await this.findOne(id, organizationId);
    await this.access.assertCanManageEmployee(user, entry.employeeId);
    entry.isActive = false;
    await this.timeTrackingRepo.save(entry);
    await this.recompute(entry);
    return true;
  }
}
