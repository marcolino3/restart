import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { In } from 'typeorm';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { EmployeePeriodOpeningBalance } from '@/employee-management/time-tracking-periods/entities/employee-period-opening-balance.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import { proRataEntitlementDays } from './work-time-calculation';
import {
  AbsenceCategorySummary,
  EmployeeWorkTimeOverviewRow,
  MonthlyWorkTimeSummary,
  VacationBalance,
  WorkTimeBalance,
} from './dto/work-time-balance.output';

/** 'YYYY-MM-DD' von heute (Serverzeit). */
function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Arbeitszeit-Salden werden nur bis heute gerechnet (colibri-Regel): künftige
 * Tage im Ledger (z. B. durch Wochen-Expansion einer künftigen Absenz
 * materialisiert) dürfen nicht als Minuszeit in den Saldo einfliessen.
 */
function clampToToday(to: string): string {
  const today = todayIso();
  return to > today ? today : to;
}

interface LedgerSumRow {
  planned_minutes: number;
  worked_minutes: number;
  vacation_minutes: number;
  absence_minutes: number;
  actual_minutes: number;
  difference_minutes: number;
  vacation_days_used: number;
  absence_days_count: number;
}

/**
 * Liest aggregierte Salden aus dem materialisierten Ledger (work_day_balances).
 * Reads laufen ausschliesslich als SUM/GROUP BY über das Ledger — die Engine
 * wird NIE beim Lesen ausgeführt (Performance-Kern, vgl. PR-B).
 *
 * Zugriffs-Scoping (service-seitig, weil @AdminPersonaOnly TEAM_LEAD aussperren
 * würde): eigene Daten immer; fremde nur für Admin-Persona (alle) oder TEAM_LEAD
 * (nur Mitarbeiter geleiteter Teams).
 */
@Injectable()
export class WorkTimeBalanceService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    @InjectRepository(EmployeePeriodOpeningBalance)
    private readonly openingBalanceRepo: Repository<EmployeePeriodOpeningBalance>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly access: TimeTrackingAccessService,
  ) {}

  /** Map employeeId → "Vorname Nachname" für die gegebenen IDs. */
  private async employeeNames(
    orgId: string,
    employeeIds: string[],
  ): Promise<Map<string, string>> {
    if (!employeeIds.length) return new Map();
    const memberships = await this.membershipRepo.find({
      where: { organizationId: orgId, employeeId: In(employeeIds) },
      relations: ['user'],
    });
    const map = new Map<string, string>();
    for (const m of memberships) {
      if (m.employeeId && m.user) {
        map.set(m.employeeId, `${m.user.firstName} ${m.user.lastName}`.trim());
      }
    }
    return map;
  }

  private async ledgerSum(
    orgId: string,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<LedgerSumRow> {
    const [row] = await this.dataSource.query<LedgerSumRow[]>(
      `SELECT
         COALESCE(SUM(planned_minutes),0)::int    AS planned_minutes,
         COALESCE(SUM(worked_minutes),0)::int     AS worked_minutes,
         COALESCE(SUM(vacation_minutes),0)::int   AS vacation_minutes,
         COALESCE(SUM(absence_minutes),0)::int    AS absence_minutes,
         COALESCE(SUM(actual_minutes),0)::int     AS actual_minutes,
         COALESCE(SUM(difference_minutes),0)::int AS difference_minutes,
         COALESCE(SUM(CASE WHEN is_vacation THEN 1 ELSE 0 END),0)::int AS vacation_days_used,
         COALESCE(SUM(CASE WHEN is_absence THEN 1 ELSE 0 END),0)::int  AS absence_days_count
       FROM work_day_balances
       WHERE organization_id = $1 AND employee_id = $2 AND date BETWEEN $3 AND $4`,
      [orgId, employeeId, from, to],
    );
    return row;
  }

  private async paidOvertimeMinutes(
    orgId: string,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<number> {
    const { sum } = (
      await this.dataSource.query<{ sum: number }[]>(
        `SELECT COALESCE(SUM(minutes),0)::int AS sum
           FROM employee_paid_overtime
          WHERE organization_id = $1 AND employee_id = $2
            AND "isActive" = true AND date BETWEEN $3 AND $4`,
        [orgId, employeeId, from, to],
      )
    )[0];
    return sum;
  }

  private async openingWorkMinutes(
    orgId: string,
    employeeId: string,
    from: string,
  ): Promise<number> {
    // Eröffnungssaldo der Periode, die am Bereichsanfang beginnt.
    const ob = await this.openingBalanceRepo
      .createQueryBuilder('ob')
      .innerJoin('ob.period', 'p')
      .where('ob.organization_id = :orgId', { orgId })
      .andWhere('ob.employee_id = :employeeId', { employeeId })
      .andWhere('p.start_date = :from', { from })
      .select('ob.opening_work_minutes', 'min')
      .getRawOne<{ min: number }>();
    return ob?.min ?? 0;
  }

  /** Saldo eines bestimmten Mitarbeiters (mit Zugriffsprüfung). */
  async getEmployeeBalance(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<WorkTimeBalance> {
    await this.access.assertCanViewEmployee(user, employeeId);
    return this.computeBalance(user.orgId as string, employeeId, from, to);
  }

  /** Eigener Saldo (kein Cross-Employee-Scoping nötig). */
  async getMyBalance(
    user: TokenPayload,
    from: string,
    to: string,
  ): Promise<WorkTimeBalance> {
    const employeeId = await this.access.resolveCallerEmployeeId(user);
    if (!employeeId) {
      throw new ForbiddenException(
        'Kein Mitarbeiterprofil für diesen Account.',
      );
    }
    return this.computeBalance(user.orgId as string, employeeId, from, to);
  }

  private async computeBalance(
    orgId: string,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<WorkTimeBalance> {
    const effectiveTo = clampToToday(to);
    const [sum, paidOvertimeMinutes, openingWorkMinutes] = await Promise.all([
      this.ledgerSum(orgId, employeeId, from, effectiveTo),
      this.paidOvertimeMinutes(orgId, employeeId, from, effectiveTo),
      this.openingWorkMinutes(orgId, employeeId, from),
    ]);
    const netBalanceMinutes =
      sum.difference_minutes + openingWorkMinutes - paidOvertimeMinutes;
    return {
      employeeId,
      fromDate: from,
      toDate: to,
      plannedMinutes: sum.planned_minutes,
      workedMinutes: sum.worked_minutes,
      vacationMinutes: sum.vacation_minutes,
      absenceMinutes: sum.absence_minutes,
      actualMinutes: sum.actual_minutes,
      differenceMinutes: sum.difference_minutes,
      openingWorkMinutes,
      paidOvertimeMinutes,
      netBalanceMinutes,
      vacationDaysUsed: sum.vacation_days_used,
      absenceDaysCount: sum.absence_days_count,
    };
  }

  /** Monats-Verlauf eines Mitarbeiters (mit Zugriffsprüfung). */
  async getMonthlySummaries(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<MonthlyWorkTimeSummary[]> {
    await this.access.assertCanViewEmployee(user, employeeId);
    const rows = await this.dataSource.query<
      {
        year: number;
        month: number;
        planned_minutes: number;
        actual_minutes: number;
        difference_minutes: number;
      }[]
    >(
      `SELECT EXTRACT(YEAR FROM date)::int  AS year,
              EXTRACT(MONTH FROM date)::int AS month,
              SUM(planned_minutes)::int     AS planned_minutes,
              SUM(actual_minutes)::int      AS actual_minutes,
              SUM(difference_minutes)::int  AS difference_minutes
         FROM work_day_balances
        WHERE organization_id = $1 AND employee_id = $2 AND date BETWEEN $3 AND $4
        GROUP BY 1, 2
        ORDER BY 1, 2`,
      [user.orgId, employeeId, from, clampToToday(to)],
    );
    return rows.map((r) => ({
      year: r.year,
      month: r.month,
      plannedMinutes: r.planned_minutes,
      actualMinutes: r.actual_minutes,
      differenceMinutes: r.difference_minutes,
    }));
  }

  /** Ferien-Saldo (Tage) eines Mitarbeiters (mit Zugriffsprüfung). */
  async getVacationBalance(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<VacationBalance> {
    await this.access.assertCanViewEmployee(user, employeeId);
    const orgId = user.orgId as string;
    const sum = await this.ledgerSum(orgId, employeeId, from, to);
    const openingDays = await this.openingVacationDays(orgId, employeeId, from);

    // Anspruch pro-rata: jeder im Bereich (teil-)aktive Vertrag trägt
    // annualVacationDays × Überlappungstage / Bereichstage bei (colibri-Regel:
    // Vertragstage / Periodentage). Ergebnis auf halbe Tage gerundet.
    const contracts = await this.contractRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.employee_id = :employeeId', { employeeId })
      .andWhere('c."isActive" = true')
      .andWhere('c.start_date <= :to', { to })
      .andWhere('(c.end_date IS NULL OR c.end_date >= :from)', { from })
      .getMany();
    const entitlementDays = proRataEntitlementDays(
      contracts.map((c) => ({
        startDate: c.startDate,
        endDate: c.endDate ?? null,
        annualVacationDays: c.annualVacationDays ?? 0,
      })),
      from,
      to,
    );
    const usedDays = sum.vacation_days_used;
    return {
      entitlementDays,
      openingDays,
      usedDays,
      remainingDays: entitlementDays + openingDays - usedDays,
    };
  }

  /** Eigener Ferien-Saldo. */
  async getMyVacationBalance(
    user: TokenPayload,
    from: string,
    to: string,
  ): Promise<VacationBalance> {
    const employeeId = await this.access.resolveCallerEmployeeId(user);
    if (!employeeId) {
      throw new ForbiddenException(
        'Kein Mitarbeiterprofil für diesen Account.',
      );
    }
    return this.getVacationBalance(user, employeeId, from, to);
  }

  private async openingVacationDays(
    orgId: string,
    employeeId: string,
    from: string,
  ): Promise<number> {
    const ob = await this.openingBalanceRepo
      .createQueryBuilder('ob')
      .innerJoin('ob.period', 'p')
      .where('ob.organization_id = :orgId', { orgId })
      .andWhere('ob.employee_id = :employeeId', { employeeId })
      .andWhere('p.start_date = :from', { from })
      .select('ob.opening_vacation_days', 'days')
      .getRawOne<{ days: string }>();
    return ob ? Number(ob.days) : 0;
  }

  /**
   * Fehlende Einträge: vergangene Arbeitstage (Soll > 0) ohne Arbeit, Ferien,
   * Absenz oder Feiertag (colibri daysWithMissingRecord). Setzt ein
   * materialisiertes Ledger voraus (Reconcile-Cron).
   */
  async getMissingRecordDays(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<string[]> {
    await this.access.assertCanViewEmployee(user, employeeId);
    const rows = await this.dataSource.query<{ date: string }[]>(
      `SELECT date::text AS date
         FROM work_day_balances
        WHERE organization_id = $1 AND employee_id = $2
          AND date BETWEEN $3 AND $4
          AND planned_minutes > 0 AND worked_minutes = 0
          AND NOT is_vacation AND NOT is_absence AND NOT is_holiday
        ORDER BY date`,
      [user.orgId, employeeId, from, clampToToday(to)],
    );
    return rows.map((r) => r.date);
  }

  async getMyMissingRecordDays(
    user: TokenPayload,
    from: string,
    to: string,
  ): Promise<string[]> {
    const employeeId = await this.access.resolveCallerEmployeeId(user);
    if (!employeeId) {
      throw new ForbiddenException(
        'Kein Mitarbeiterprofil für diesen Account.',
      );
    }
    return this.getMissingRecordDays(user, employeeId, from, to);
  }

  /** Absenz-Tage je Kategorie, aufgeteilt in 100 % / Teilabsenzen. */
  async getAbsenceCategorySummaries(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
    locale = 'DE',
  ): Promise<AbsenceCategorySummary[]> {
    await this.access.assertCanViewEmployee(user, employeeId);
    const rows = await this.dataSource.query<
      {
        category_id: string;
        name: string | null;
        color: string | null;
        full_days: number;
        partial_days: number;
        total_days: number;
      }[]
    >(
      `SELECT c.id::text AS category_id,
              COALESCE(t.name, c.system_code::text) AS name,
              c.color AS color,
              COUNT(*) FILTER (WHERE a.percentage >= 100)::int AS full_days,
              COUNT(*) FILTER (WHERE a.percentage < 100)::int  AS partial_days,
              COUNT(*)::int AS total_days
         FROM employee_absence_days d
         JOIN employee_absences a ON a.id = d.employee_absence_id
         JOIN employee_absence_categories c ON c.id = a.absence_category_id
         LEFT JOIN employee_absence_category_translations t
                ON t.category_id = c.id AND t.locale = $5
        WHERE d.organization_id = $1 AND d.employee_id = $2
          AND d.date >= $3::date AND d.date < ($4::date + 1)
          AND a."isActive" = true AND d."isActive" = true
        GROUP BY 1, 2, 3
        ORDER BY 2`,
      [user.orgId, employeeId, from, to, locale],
    );
    return rows.map((r) => ({
      categoryId: r.category_id,
      name: r.name,
      color: r.color,
      fullDays: r.full_days,
      partialDays: r.partial_days,
      totalDays: r.total_days,
    }));
  }

  /** Auswertung: Saldo-Übersicht aller sichtbaren Mitarbeiter (Lead/Admin). */
  async getTeamOverview(
    user: TokenPayload,
    from: string,
    to: string,
  ): Promise<EmployeeWorkTimeOverviewRow[]> {
    const orgId = user.orgId as string;
    const employeeIds = await this.access.resolveOverviewScope(user, orgId);
    if (employeeIds !== null && employeeIds.length === 0) return [];

    const params: unknown[] = [orgId, from, clampToToday(to)];
    let scopeClause = '';
    if (employeeIds !== null) {
      params.push(employeeIds);
      scopeClause = `AND employee_id = ANY($4::uuid[])`;
    }
    const rows = await this.dataSource.query<
      { employee_id: string; net: number; vac: number }[]
    >(
      `SELECT employee_id::text AS employee_id,
              SUM(difference_minutes)::int AS net,
              SUM(CASE WHEN is_vacation THEN 1 ELSE 0 END)::int AS vac
         FROM work_day_balances
        WHERE organization_id = $1 AND date BETWEEN $2 AND $3 ${scopeClause}
        GROUP BY employee_id`,
      params,
    );
    const names = await this.employeeNames(
      orgId,
      rows.map((r) => r.employee_id),
    );
    return rows.map((r) => ({
      employeeId: r.employee_id,
      employeeName: names.get(r.employee_id) ?? null,
      netBalanceMinutes: r.net,
      vacationDaysUsed: r.vac,
    }));
  }
}
