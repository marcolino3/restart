import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayInput } from './dto/create-holiday.input';
import { UpdateHolidayInput } from './dto/update-holiday.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';

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
      organizationId,
    });
    const saved = await this.holidayRepo.save(holiday);
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      saved.date,
      saved.date,
    );
    return saved;
  }

  async update(
    input: UpdateHolidayInput,
    organizationId: string,
  ): Promise<Holiday> {
    const holiday = await this.findOne(input.id, organizationId);
    const previousDate = holiday.date;
    const { id: _id, ...rest } = input;
    Object.assign(holiday, rest);
    const saved = await this.holidayRepo.save(holiday);
    const from = previousDate < saved.date ? previousDate : saved.date;
    const to = previousDate > saved.date ? previousDate : saved.date;
    await this.balanceRecompute.recomputeOrgRange(organizationId, from, to);
    return saved;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const holiday = await this.findOne(id, organizationId);
    holiday.isActive = false;
    await this.holidayRepo.save(holiday);
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      holiday.date,
      holiday.date,
    );
    return true;
  }

  private async findOne(id: string, organizationId: string): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
    return holiday;
  }
}
