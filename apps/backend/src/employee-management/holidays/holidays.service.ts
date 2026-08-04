import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayInput } from './dto/create-holiday.input';
import { UpdateHolidayInput } from './dto/update-holiday.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';

interface HolidayRecomputeSnapshot {
  date: string;
  repeatsYearly: boolean;
}

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    private readonly balanceRecompute: BalanceRecomputeService,
  ) {}

  findAll(organizationId: string): Promise<Holiday[]> {
    return this.holidayRepo.find({
      where: { organizationId, isActive: true },
      order: { date: 'ASC' },
    });
  }

  async create(
    input: CreateHolidayInput,
    organizationId: string,
  ): Promise<Holiday> {
    const holiday = this.holidayRepo.create({
      ...input,
      paidPercentage: input.paidPercentage ?? 100,
      repeatsYearly: input.repeatsYearly ?? false,
      organizationId,
    });
    const saved = await this.holidayRepo.save(holiday);
    const { from, to } = this.recomputeRangeForHoliday(saved);
    await this.balanceRecompute.recomputeOrgRange(organizationId, from, to);
    return saved;
  }

  async update(
    input: UpdateHolidayInput,
    organizationId: string,
  ): Promise<Holiday> {
    const holiday = await this.findOne(input.id, organizationId);
    const previous = this.toRecomputeSnapshot(holiday);
    const { id: _id, ...rest } = input;
    Object.assign(holiday, rest);
    const saved = await this.holidayRepo.save(holiday);
    const { from, to } = this.recomputeRangeForHoliday(saved, previous);
    await this.balanceRecompute.recomputeOrgRange(organizationId, from, to);
    return saved;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const holiday = await this.findOne(id, organizationId);
    const snapshot = this.toRecomputeSnapshot(holiday);
    holiday.isActive = false;
    await this.holidayRepo.save(holiday);
    const { from, to } = this.recomputeRangeForHoliday(snapshot);
    await this.balanceRecompute.recomputeOrgRange(organizationId, from, to);
    return true;
  }

  private toRecomputeSnapshot(holiday: Holiday): HolidayRecomputeSnapshot {
    return {
      date: holiday.date,
      repeatsYearly: holiday.repeatsYearly,
    };
  }

  /** Einmalige Feiertage: nur der Tag; jährliche: gesamter relevanter Jahresbereich. */
  private recomputeRangeForHoliday(
    holiday: HolidayRecomputeSnapshot,
    previous?: HolidayRecomputeSnapshot,
  ): { from: string; to: string } {
    const snapshots = [holiday, ...(previous ? [previous] : [])];
    const isYearly = snapshots.some((h) => h.repeatsYearly);

    if (!isYearly) {
      const dates = snapshots.map((h) => h.date);
      return {
        from: dates.reduce((min, d) => (d < min ? d : min)),
        to: dates.reduce((max, d) => (d > max ? d : max)),
      };
    }

    // Yearly holidays apply to every calendar year with the same month/day,
    // regardless of the stored anchor year. Always cover at least the current
    // year through next year so a future-dated anchor still refreshes today.
    const now = DateTime.now().setZone('Europe/Zurich');
    const years = snapshots.map((h) => DateTime.fromISO(h.date).year);
    const minYear = Math.min(now.year, ...years);
    const maxYear = Math.max(now.year + 1, ...years);
    return {
      from: `${minYear}-01-01`,
      to: `${maxYear}-12-31`,
    };
  }

  private async findOne(id: string, organizationId: string): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
    return holiday;
  }
}
