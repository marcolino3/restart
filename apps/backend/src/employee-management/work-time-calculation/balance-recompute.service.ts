import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { WorkDayBalance } from '@/employee-management/work-day-balances/entities/work-day-balance.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { calculateDays } from './work-time-calculation';
import { BalanceInputLoaderService } from './balance-input-loader.service';

@Injectable()
export class BalanceRecomputeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inputLoader: BalanceInputLoaderService,
    @InjectRepository(WorkDayBalance)
    private readonly balanceRepo: Repository<WorkDayBalance>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  /**
   * Recompute für alle Mitarbeiter der Org mit aktivierter Zeiterfassung —
   * für org-weite Änderungen (Feiertag, Betriebsferien). Begrenzte Parallelität
   * statt einer Mega-Transaktion (lange Locks vermeiden).
   */
  async recomputeOrgRange(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ): Promise<void> {
    const employees = await this.employeeRepo
      .createQueryBuilder('e')
      .innerJoin('e.membership', 'm')
      .where('m.organization_id = :organizationId', { organizationId })
      .andWhere('e.time_tracking_enabled = true')
      .andWhere('e."isActive" = true')
      .andWhere('m."isActive" = true')
      .select('e.id', 'id')
      .getRawMany<{ id: string }>();

    const concurrency = 5;
    for (let i = 0; i < employees.length; i += concurrency) {
      const batch = employees.slice(i, i + concurrency);
      await Promise.all(
        batch.map((emp) =>
          this.recomputeRange(organizationId, emp.id, fromDate, toDate),
        ),
      );
    }
  }

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
    const from = DateTime.fromISO(fromDate)
      .startOf('week')
      .toISODate() as string;
    const to = DateTime.fromISO(toDate).endOf('week').toISODate() as string;

    const input = await this.inputLoader.loadCalcInput(
      organizationId,
      employeeId,
      from,
      to,
    );
    const results = calculateDays(input);

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
        .where('organization_id = :organizationId', { organizationId })
        .andWhere('employee_id = :employeeId', { employeeId })
        .andWhere('date BETWEEN :from AND :to', { from, to })
        .execute();
      if (rows.length) await manager.save(rows);
    });
  }
}
