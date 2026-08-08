import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyVacation } from './entities/company-vacation.entity';
import { CreateCompanyVacationInput } from './dto/create-company-vacation.input';
import { UpdateCompanyVacationInput } from './dto/update-company-vacation.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { Holiday } from '../holidays/entities/holiday.entity';
import {
  calculateEffectiveVacationDays,
  listVacationHolidays,
} from '../work-time-calculation/work-time-calculation';
import { CompanyVacationHoliday } from './entities/company-vacation-holiday.entity';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { sortByPeriodAnchor } from '../time-tracking-periods/sort-by-anchor';

@Injectable()
export class CompanyVacationsService {
  constructor(
    @InjectRepository(CompanyVacation)
    private readonly repo: Repository<CompanyVacation>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly periodsService: TimeTrackingPeriodsService,
  ) {}

  /** Sortiert ab dem Org-Stichtag, nicht kalendarisch ab Januar. */
  async findAll(organizationId: string): Promise<CompanyVacation[]> {
    const [vacations, anchor] = await Promise.all([
      this.repo.find({
        where: { organizationId, isActive: true },
        order: { startDate: 'ASC' },
      }),
      this.periodsService.getAnchor(organizationId),
    ]);
    return sortByPeriodAnchor(vacations, anchor, (v) => v.startDate);
  }

  async create(
    input: CreateCompanyVacationInput,
    organizationId: string,
  ): Promise<CompanyVacation> {
    const entity = this.repo.create({
      ...input,
      organizationId,
    });
    entity.effectiveDays = await this.computeEffectiveDays(
      organizationId,
      entity.startDate,
      entity.endDate,
    );
    const saved = await this.repo.save(entity);
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      saved.startDate,
      saved.endDate,
    );
    return saved;
  }

  async update(
    input: UpdateCompanyVacationInput,
    organizationId: string,
  ): Promise<CompanyVacation> {
    const entity = await this.findOne(input.id, organizationId);
    const prevStart = entity.startDate;
    const prevEnd = entity.endDate;
    const { id: _id, ...rest } = input;
    Object.assign(entity, rest);
    entity.effectiveDays = await this.computeEffectiveDays(
      organizationId,
      entity.startDate,
      entity.endDate,
    );
    const saved = await this.repo.save(entity);
    // Sowohl alten als auch neuen Bereich neu rechnen.
    const from = prevStart < saved.startDate ? prevStart : saved.startDate;
    const to = prevEnd > saved.endDate ? prevEnd : saved.endDate;
    await this.balanceRecompute.recomputeOrgRange(organizationId, from, to);
    return saved;
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const entity = await this.findOne(id, organizationId);
    entity.isActive = false;
    await this.repo.save(entity);
    await this.balanceRecompute.recomputeOrgRange(
      organizationId,
      entity.startDate,
      entity.endDate,
    );
    return true;
  }

  /**
   * Neu berechnet `effectiveDays` aller aktiven Betriebsferien der Org, deren
   * Bereich mit dem geänderten Feiertag überschneiden könnte. Wird von
   * HolidaysService bei jedem Holiday-CRUD aufgerufen, weil ein einzelner
   * Feiertag (v.a. jährlich wiederkehrend) mehrere Betriebsferien betrifft.
   */
  async recomputeEffectiveDaysForOrg(organizationId: string): Promise<void> {
    const vacations = await this.repo.find({
      where: { organizationId, isActive: true },
    });
    for (const vacation of vacations) {
      vacation.effectiveDays = await this.computeEffectiveDays(
        organizationId,
        vacation.startDate,
        vacation.endDate,
      );
    }
    if (vacations.length) await this.repo.save(vacations);
  }

  /**
   * Feiertage, die in den Zeitraum einer Betriebsferien fallen — für Anzeige
   * (Anzahl + Auflistung). `date` ist das aufgelöste Datum im Zeitraum.
   */
  async findHolidaysInRange(
    organizationId: string,
    startDate: string,
    endDate: string,
  ): Promise<CompanyVacationHoliday[]> {
    const holidays = await this.holidayRepo.find({
      where: { organizationId, isActive: true },
    });
    return listVacationHolidays(startDate, endDate, holidays).map(
      ({ date, holiday, isWeekend }) => ({
        date,
        name: holiday.name,
        paidPercentage: holiday.paidPercentage,
        isWeekend,
      }),
    );
  }

  private async computeEffectiveDays(
    organizationId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const holidays = await this.holidayRepo.find({
      where: { organizationId, isActive: true },
    });
    return calculateEffectiveVacationDays(startDate, endDate, holidays);
  }

  private async findOne(
    id: string,
    organizationId: string,
  ): Promise<CompanyVacation> {
    const entity = await this.repo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!entity) throw new NotFoundException(`CompanyVacation ${id} not found`);
    return entity;
  }
}
