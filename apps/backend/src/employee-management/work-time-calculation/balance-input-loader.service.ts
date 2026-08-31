import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { EmployeeAbsenceStatus } from '@/employee-management/employee-absences/entities/employee-absence-status.enum';
import { EmployeeVacation } from '@/employee-management/employee-vacations/entities/employee-vacation.entity';
import { CompanyVacationAssignment } from '@/employee-management/company-vacation-assignments/entities/company-vacation-assignment.entity';
import { TimeTracking } from '@/employee-management/time-tracking/entities/time-tracking.entity';
import {
  CalcAbsenceDay,
  CalcInput,
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

/** Optionale, rein transiente Anpassung geladener Verträge (z. B. hypothetisches Austrittsdatum für Simulationen). */
export interface CalcInputOverrides {
  contractEndDateOverride?: string;
}

/**
 * Lädt die Rohdaten für einen Mitarbeiter/Bereich und mappt sie auf {@link CalcInput}.
 * Gemeinsam genutzt von BalanceRecomputeService (persistiert) und
 * WorkTimeSimulationService (transient, kein DB-Write).
 */
@Injectable()
export class BalanceInputLoaderService {
  constructor(
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(EmployeeAbsence)
    private readonly absenceRepo: Repository<EmployeeAbsence>,
    @InjectRepository(EmployeeVacation)
    private readonly vacationRepo: Repository<EmployeeVacation>,
    @InjectRepository(CompanyVacationAssignment)
    private readonly companyVacationAssignmentRepo: Repository<CompanyVacationAssignment>,
    @InjectRepository(TimeTracking)
    private readonly timeTrackingRepo: Repository<TimeTracking>,
  ) {}

  async loadCalcInput(
    organizationId: string,
    employeeId: string,
    from: string,
    to: string,
    overrides?: CalcInputOverrides,
  ): Promise<CalcInput> {
    const [
      contracts,
      holidays,
      absences,
      vacations,
      companyVacations,
      entries,
    ] = await Promise.all([
      this.contractRepo.find({
        where: { organizationId, employeeId, isActive: true },
      }),
      this.holidayRepo.find({ where: { organizationId, isActive: true } }),
      // Only definitive absences count: pending requests and rejected ones
      // must not touch the balance.
      this.absenceRepo.find({
        where: {
          organizationId,
          employeeId,
          isActive: true,
          status: EmployeeAbsenceStatus.APPROVED,
        },
        relations: ['absenceCategory'],
      }),
      this.vacationRepo.find({
        where: { organizationId, employeeId, isActive: true },
      }),
      this.companyVacationAssignmentRepo
        .find({
          where: { organizationId, employeeId, isActive: true },
          relations: { companyVacation: true },
        })
        .then((links) =>
          links.map((link) => link.companyVacation).filter((v) => v.isActive),
        ),
      this.timeTrackingRepo.find({
        where: { organizationId, employeeId, isActive: true },
      }),
    ]);

    // Absenzen → Tageseinträge
    const absenceDays: CalcAbsenceDay[] = [];
    for (const a of absences) {
      const aEnd = (
        a.endDate
          ? DateTime.fromJSDate(a.endDate).toISODate()
          : DateTime.fromJSDate(a.startDate).toISODate()
      ) as string;
      const aStart = DateTime.fromJSDate(a.startDate).toISODate() as string;
      if (!overlaps(aStart, aEnd, from, to)) continue;
      for (const date of expandDays(aStart, aEnd)) {
        if (date < from || date > to) continue;
        absenceDays.push({
          date,
          percentage: a.percentage ?? 100,
          absenceMinutes: timedAbsenceMinutes(a.startTime, a.endTime),
          countsAsWorkTime: a.absenceCategory?.countsAsWorkTime ?? false,
          isVacationCapable:
            a.isVacationCapable ??
            a.absenceCategory?.defaultIsVacationCapable ??
            true,
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

    const contractEndDateOverride = overrides?.contractEndDateOverride;

    return {
      rangeStart: from,
      rangeEnd: to,
      contracts: contracts
        .filter(
          (c) =>
            !contractEndDateOverride || c.startDate <= contractEndDateOverride,
        )
        .map((c) => ({
          id: c.id,
          startDate: c.startDate,
          endDate: contractEndDateOverride
            ? c.endDate && c.endDate < contractEndDateOverride
              ? c.endDate
              : contractEndDateOverride
            : (c.endDate ?? null),
          weeklyHours: c.weeklyHours ? Number(c.weeklyHours) : 0,
          workloadPercent:
            c.workloadPercent != null ? Number(c.workloadPercent) : null,
          weekdayWorkloads: c.weekdayWorkloads ?? null,
          weekdayTimeWindows: c.weekdayTimeWindows ?? null,
        })),
      holidays: holidays.map((h) => ({
        date: h.date,
        paidPercentage: h.paidPercentage,
        repeatsYearly: h.repeatsYearly,
      })),
      absenceDays,
      vacationDays,
      workEntries: entries
        .filter((e) => e.entryDate >= from && e.entryDate <= to)
        .map((e) => ({ date: e.entryDate, workMinutes: e.workMinutes ?? 0 })),
    };
  }
}

/** Minutes between `HH:mm[:ss]` times, or undefined when not a timed absence. */
function timedAbsenceMinutes(
  start?: string | null,
  end?: string | null,
): number | undefined {
  if (!start || !end) return undefined;
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const minutes = toMin(end) - toMin(start);
  return minutes > 0 ? minutes : undefined;
}
