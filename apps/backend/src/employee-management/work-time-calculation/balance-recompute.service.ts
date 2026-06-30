import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { EmployeeVacation } from '@/employee-management/employee-vacations/entities/employee-vacation.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { TimeTracking } from '@/employee-management/time-tracking/entities/time-tracking.entity';
import { WorkDayBalance } from '@/employee-management/work-day-balances/entities/work-day-balance.entity';
import { calculateDays } from './work-time-calculation';
import {
  CalcAbsenceDay,
  CalcVacationDay,
} from './work-time-calculation.types';

/** Alle Kalendertage [from..to] inklusive als ISO-Strings. */
function expandDays(from: string, to: string): string[] {
  const out: string[] = [];
  let d = DateTime.fromISO(from);
  const end = DateTime.fromISO(to);
  while (d <= end) {
    out.push(d.toISODate() as string);
    d = d.plus({ days: 1 });
  }
  return out;
}

/** Überlappt [aStart..aEnd] das Fenster [from..to]? */
function overlaps(aStart: string, aEnd: string, from: string, to: string) {
  return aStart <= to && aEnd >= from;
}

@Injectable()
export class BalanceRecomputeService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(EmployeeAbsence)
    private readonly absenceRepo: Repository<EmployeeAbsence>,
    @InjectRepository(EmployeeVacation)
    private readonly vacationRepo: Repository<EmployeeVacation>,
    @InjectRepository(CompanyVacation)
    private readonly companyVacationRepo: Repository<CompanyVacation>,
    @InjectRepository(TimeTracking)
    private readonly timeTrackingRepo: Repository<TimeTracking>,
    @InjectRepository(WorkDayBalance)
    private readonly balanceRepo: Repository<WorkDayBalance>,
  ) {}

  /**
   * Berechnet das Ledger für einen Mitarbeiter im Bereich neu. Der Bereich wird
   * auf volle ISO-Wochen erweitert (Mo–So), weil der Überzeit-Cap wochenweise
   * rechnet. Bestehende Ledger-Zeilen im erweiterten Bereich werden ersetzt.
   */
  async recomputeRange(
    organizationId: string,
    employeeId: string,
    fromDate: string,
    toDate: string,
  ): Promise<void> {
    const from = DateTime.fromISO(fromDate).startOf('week').toISODate() as string;
    const to = DateTime.fromISO(toDate).endOf('week').toISODate() as string;

    const [contracts, holidays, absences, vacations, companyVacations, entries] =
      await Promise.all([
        this.contractRepo.find({
          where: { organizationId, employeeId, isActive: true },
        }),
        this.holidayRepo.find({ where: { organizationId, isActive: true } }),
        this.absenceRepo.find({
          where: { organizationId, employeeId, isActive: true },
          relations: ['absenceCategory'],
        }),
        this.vacationRepo.find({
          where: { organizationId, employeeId, isActive: true },
        }),
        this.companyVacationRepo.find({
          where: { organizationId, isActive: true, appliesToAll: true },
        }),
        this.timeTrackingRepo.find({
          where: { organizationId, employeeId, isActive: true },
        }),
      ]);

    // Absenzen → Tageseinträge
    const absenceDays: CalcAbsenceDay[] = [];
    for (const a of absences) {
      const aEnd = (a.endDate
        ? DateTime.fromJSDate(a.endDate).toISODate()
        : DateTime.fromJSDate(a.startDate).toISODate()) as string;
      const aStart = DateTime.fromJSDate(a.startDate).toISODate() as string;
      if (!overlaps(aStart, aEnd, from, to)) continue;
      for (const date of expandDays(aStart, aEnd)) {
        if (date < from || date > to) continue;
        absenceDays.push({
          date,
          percentage: a.percentage ?? 100,
          countsAsWorkTime: a.absenceCategory?.countsAsWorkTime ?? false,
        });
      }
    }

    // Ferien (persönlich + Betriebsferien) → Tageseinträge
    const vacationDays: CalcVacationDay[] = [];
    const pushVacation = (start: string, end: string) => {
      if (!overlaps(start, end, from, to)) return;
      for (const date of expandDays(start, end)) {
        if (date >= from && date <= to) vacationDays.push({ date });
      }
    };
    for (const v of vacations) pushVacation(v.startDate, v.endDate);
    for (const cv of companyVacations) pushVacation(cv.startDate, cv.endDate);

    const results = calculateDays({
      rangeStart: from,
      rangeEnd: to,
      contracts: contracts.map((c) => ({
        id: c.id,
        startDate: c.startDate,
        endDate: c.endDate ?? null,
        weeklyHours: c.weeklyHours ? Number(c.weeklyHours) : 0,
        weekdayWorkloads: c.weekdayWorkloads ?? null,
      })),
      holidays: holidays.map((h) => ({
        date: h.date,
        paidPercentage: h.paidPercentage,
      })),
      absenceDays,
      vacationDays,
      workEntries: entries
        .filter((e) => e.entryDate >= from && e.entryDate <= to)
        .map((e) => ({ date: e.entryDate, workMinutes: e.workMinutes ?? 0 })),
    });

    const computedAt = new Date();
    const rows = results.map((r) =>
      this.balanceRepo.create({
        organizationId,
        employeeId,
        date: r.date,
        contractId: r.contractId,
        plannedMinutes: r.plannedMinutes,
        workedMinutes: r.workedMinutes,
        vacationMinutes: r.vacationMinutes,
        absenceMinutes: r.absenceMinutes,
        actualMinutes: r.actualMinutes,
        differenceMinutes: r.differenceMinutes,
        cappedMinutes: r.cappedMinutes,
        isWeekend: r.isWeekend,
        isHoliday: r.isHoliday,
        isVacation: r.isVacation,
        isAbsence: r.isAbsence,
        isFreeDay: r.isFreeDay,
        isNoContract: r.isNoContract,
        overtimeCapped: r.overtimeCapped,
        computedAt,
      }),
    );

    // Ersetze den Bereich atomar (delete + insert vermeidet Version-Konflikte
    // bei upsert auf der VersionColumn).
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(WorkDayBalance)
        .where('employee_id = :employeeId', { employeeId })
        .andWhere('date BETWEEN :from AND :to', { from, to })
        .execute();
      if (rows.length) await manager.save(rows);
    });
  }
}
