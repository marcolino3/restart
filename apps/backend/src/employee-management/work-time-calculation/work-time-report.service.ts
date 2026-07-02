import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { TimeTracking } from '@/employee-management/time-tracking/entities/time-tracking.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { WorkTimeBalanceService } from './work-time-balance.service';

// pdfmake 0.3 ist ein CJS-Singleton ohne brauchbare Typen für den Server-Pfad.
/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pdfmake = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const helveticaContainer = require('pdfmake/standard-fonts/Helvetica');
/* eslint-enable @typescript-eslint/no-require-imports */

const STANDARD_FONT_FILES = new Set([
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
]);

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
pdfmake.setFonts(helveticaContainer);
// Nur die eingebetteten Standard-Fonts; keine sonstigen FS-/URL-Zugriffe.
pdfmake.setLocalAccessPolicy((path: string) => STANDARD_FONT_FILES.has(path));
pdfmake.setUrlAccessPolicy(() => false);
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

type ReportLocale = 'DE' | 'EN';

const STRINGS: Record<ReportLocale, Record<string, string>> = {
  DE: {
    title: 'Arbeitszeitauswertung',
    period: 'Zeitraum',
    generated: 'Erstellt am',
    calculation: 'Berechnung',
    planned: 'Sollzeit',
    actual: 'Ist-Zeit',
    workBalance: 'Arbeitssaldo',
    openingBalance: 'Eröffnungssaldo (Vorperiode)',
    paidOvertime: 'Ausbezahlte Überzeit',
    totalBalance: 'Über-/Minuszeit gesamt',
    vacation: 'Ferien',
    vacationEntitlement: 'Ferienanspruch (pro-rata)',
    vacationOpening: 'Eröffnungssaldo Ferien',
    vacationUsed: 'Bezogene Ferientage',
    vacationRemaining: 'Verbleibende Ferientage',
    absences: 'Absenzen',
    absencesTotal: 'Absenz-Tage gesamt',
    missingRecords: 'Fehlende Einträge',
    category: 'Kategorie',
    days: 'Tage',
    fullDay: '100 %',
    partialDay: '< 100 %',
    contracts: 'Verträge',
    position: 'Funktion',
    workload: 'Pensum',
    weeklyHours: 'Std./Woche',
    from: 'Von',
    to: 'Bis',
    open: 'offen',
    date: 'Datum',
    entry: 'Eintrag',
    workTime: 'Arbeitszeit',
    difference: 'Differenz',
    cappedBy: 'gekürzt um',
    monthTotal: 'Monatssaldo',
    holiday: 'Feiertag',
    vacationDay: 'Ferien',
    absenceDay: 'Absenz',
    weekend: 'Wochenende',
    freeDay: 'Frei',
    noContract: 'Kein Vertrag',
    work: 'Arbeit',
    missing: 'Fehlender Eintrag',
    breakShort: 'Pause',
    page: 'Seite',
    of: 'von',
    none: 'keine',
  },
  EN: {
    title: 'Work time report',
    period: 'Period',
    generated: 'Generated on',
    calculation: 'Calculation',
    planned: 'Planned time',
    actual: 'Actual time',
    workBalance: 'Work time balance',
    openingBalance: 'Opening balance (previous period)',
    paidOvertime: 'Paid out overtime',
    totalBalance: 'Total over-/undertime',
    vacation: 'Vacation',
    vacationEntitlement: 'Vacation entitlement (pro-rata)',
    vacationOpening: 'Vacation opening balance',
    vacationUsed: 'Vacation days used',
    vacationRemaining: 'Vacation days remaining',
    absences: 'Absences',
    absencesTotal: 'Total absence days',
    missingRecords: 'Missing records',
    category: 'Category',
    days: 'Days',
    fullDay: '100 %',
    partialDay: '< 100 %',
    contracts: 'Contracts',
    position: 'Position',
    workload: 'Workload',
    weeklyHours: 'Hours/week',
    from: 'From',
    to: 'To',
    open: 'open',
    date: 'Date',
    entry: 'Entry',
    workTime: 'Work time',
    difference: 'Difference',
    cappedBy: 'capped by',
    monthTotal: 'Month total',
    holiday: 'Holiday',
    vacationDay: 'Vacation',
    absenceDay: 'Absence',
    weekend: 'Weekend',
    freeDay: 'Free day',
    noContract: 'No contract',
    work: 'Work',
    missing: 'Missing record',
    breakShort: 'Break',
    page: 'Page',
    of: 'of',
    none: 'none',
  },
};

const COLOR_POSITIVE = '#15803d';
const COLOR_NEGATIVE = '#b91c1c';
const COLOR_MUTED = '#6b7280';

/** Minuten → 'h:mm' mit Vorzeichen für Salden. */
function fmtMinutes(min: number, signed = false): string {
  const sign = min < 0 ? '-' : signed && min > 0 ? '+' : '';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, '0')}`;
}

function fmtDate(iso: string, locale: ReportLocale): string {
  return DateTime.fromISO(iso).toFormat(
    locale === 'DE' ? 'dd.MM.yyyy' : 'yyyy-MM-dd',
  );
}

interface LedgerDayRow {
  date: string;
  planned_minutes: number;
  worked_minutes: number;
  vacation_minutes: number;
  absence_minutes: number;
  actual_minutes: number;
  difference_minutes: number;
  capped_minutes: number;
  is_weekend: boolean;
  is_holiday: boolean;
  is_vacation: boolean;
  is_absence: boolean;
  is_free_day: boolean;
  is_no_contract: boolean;
  overtime_capped: boolean;
}

/**
 * Serverseitiger PDF-Report der Arbeitszeitauswertung (colibri-Parität:
 * Berechnungs-Block, Ferien/Absenzen, Kategorien, Verträge, Monats-Tabellen
 * mit Tageszeilen inkl. Überzeit-Kürzungs-Vermerk).
 */
@Injectable()
export class WorkTimeReportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly balanceService: WorkTimeBalanceService,
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    @InjectRepository(TimeTracking)
    private readonly timeTrackingRepo: Repository<TimeTracking>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  async buildEmployeeReportPdf(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
    locale: ReportLocale,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const orgId = user.orgId as string;
    // getEmployeeBalance enthält den Zugriffs-Check (self/Admin/Lead-Scope).
    const balance = await this.balanceService.getEmployeeBalance(
      user,
      employeeId,
      from,
      to,
    );
    const [
      vacation,
      categories,
      missingDays,
      contracts,
      dayRows,
      entries,
      employeeName,
      organization,
    ] = await Promise.all([
      this.balanceService.getVacationBalance(user, employeeId, from, to),
      this.balanceService.getAbsenceCategorySummaries(
        user,
        employeeId,
        from,
        to,
        locale,
      ),
      this.balanceService.getMissingRecordDays(user, employeeId, from, to),
      this.contractRepo
        .createQueryBuilder('c')
        .where('c.organization_id = :orgId', { orgId })
        .andWhere('c.employee_id = :employeeId', { employeeId })
        .andWhere('c."isActive" = true')
        .andWhere('c.start_date <= :to', { to })
        .andWhere('(c.end_date IS NULL OR c.end_date >= :from)', { from })
        .orderBy('c.start_date', 'ASC')
        .getMany(),
      this.loadDayRows(orgId, employeeId, from, to),
      this.timeTrackingRepo
        .createQueryBuilder('t')
        .where('t.organization_id = :orgId', { orgId })
        .andWhere('t.employee_id = :employeeId', { employeeId })
        .andWhere('t."isActive" = true')
        .andWhere('t.entry_date BETWEEN :from AND :to', { from, to })
        .orderBy('t.started_at', 'ASC')
        .getMany(),
      this.resolveEmployeeName(orgId, employeeId),
      this.organizationRepo.findOne({ where: { id: orgId } }),
    ]);

    const t = STRINGS[locale];
    const segmentsByDate = new Map<string, string[]>();
    for (const e of entries) {
      const seg = this.formatSegment(e, t);
      const list = segmentsByDate.get(e.entryDate) ?? [];
      list.push(seg);
      segmentsByDate.set(e.entryDate, list);
    }

    const docDefinition = this.buildDocDefinition({
      t,
      locale,
      employeeName,
      orgName: organization?.name ?? '',
      from,
      to,
      balance,
      vacation,
      categories,
      missingDays,
      contracts,
      dayRows,
      segmentsByDate,
    });

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    const doc = pdfmake.createPdf(docDefinition);
    const buffer: Buffer = await doc.getBuffer();
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

    const safeName = employeeName.replace(/[^\p{L}\p{N}]+/gu, '_') || 'report';
    return {
      buffer,
      filename: `${safeName}_${from}_${to}.pdf`,
    };
  }

  private async loadDayRows(
    orgId: string,
    employeeId: string,
    from: string,
    to: string,
  ): Promise<LedgerDayRow[]> {
    return this.dataSource.query<LedgerDayRow[]>(
      `SELECT date::text AS date,
              planned_minutes, worked_minutes, vacation_minutes,
              absence_minutes, actual_minutes, difference_minutes,
              capped_minutes, is_weekend, is_holiday, is_vacation,
              is_absence, is_free_day, is_no_contract, overtime_capped
         FROM work_day_balances
        WHERE organization_id = $1 AND employee_id = $2
          AND date BETWEEN $3 AND $4
        ORDER BY date`,
      [orgId, employeeId, from, to],
    );
  }

  private async resolveEmployeeName(
    orgId: string,
    employeeId: string,
  ): Promise<string> {
    const membership = await this.membershipRepo.findOne({
      where: { organizationId: orgId, employeeId },
      relations: ['user'],
    });
    if (!membership?.user) return '';
    return `${membership.user.firstName} ${membership.user.lastName}`.trim();
  }

  private formatSegment(e: TimeTracking, t: Record<string, string>): string {
    const start = DateTime.fromJSDate(e.startedAt).toFormat('HH:mm');
    const end = e.endedAt
      ? DateTime.fromJSDate(e.endedAt).toFormat('HH:mm')
      : '…';
    const brk = e.breakMinutes ? ` (${t.breakShort} ${e.breakMinutes}′)` : '';
    return `${start}–${end}${brk}`;
  }

  private dayLabel(row: LedgerDayRow, t: Record<string, string>): string {
    if (row.is_holiday) return t.holiday;
    if (row.is_vacation) return t.vacationDay;
    if (row.is_absence) return t.absenceDay;
    if (row.is_no_contract) return t.noContract;
    if (row.worked_minutes > 0) return t.work;
    if (row.is_weekend) return t.weekend;
    if (row.is_free_day) return t.freeDay;
    if (row.planned_minutes > 0) return t.missing;
    return '';
  }

  private buildDocDefinition(input: {
    t: Record<string, string>;
    locale: ReportLocale;
    employeeName: string;
    orgName: string;
    from: string;
    to: string;
    balance: {
      plannedMinutes: number;
      actualMinutes: number;
      differenceMinutes: number;
      openingWorkMinutes: number;
      paidOvertimeMinutes: number;
      netBalanceMinutes: number;
      absenceDaysCount: number;
    };
    vacation: {
      entitlementDays: number;
      openingDays: number;
      usedDays: number;
      remainingDays: number;
    };
    categories: {
      name: string | null;
      fullDays: number;
      partialDays: number;
      totalDays: number;
    }[];
    missingDays: string[];
    contracts: EmployeeContract[];
    dayRows: LedgerDayRow[];
    segmentsByDate: Map<string, string[]>;
  }): Record<string, unknown> {
    const { t, locale, balance, vacation } = input;

    const balColor = (v: number) => (v < 0 ? COLOR_NEGATIVE : COLOR_POSITIVE);

    const summaryTable = {
      style: 'block',
      table: {
        widths: ['*', 'auto'],
        body: [
          [{ text: t.calculation, style: 'blockHeader', colSpan: 2 }, {}],
          [t.planned, fmtMinutes(balance.plannedMinutes)],
          [t.actual, fmtMinutes(balance.actualMinutes)],
          [
            t.workBalance,
            {
              text: fmtMinutes(balance.differenceMinutes, true),
              color: balColor(balance.differenceMinutes),
            },
          ],
          [t.openingBalance, fmtMinutes(balance.openingWorkMinutes, true)],
          [t.paidOvertime, fmtMinutes(-balance.paidOvertimeMinutes, true)],
          [
            { text: t.totalBalance, bold: true },
            {
              text: fmtMinutes(balance.netBalanceMinutes, true),
              bold: true,
              color: balColor(balance.netBalanceMinutes),
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    };

    const vacationTable = {
      style: 'block',
      table: {
        widths: ['*', 'auto'],
        body: [
          [{ text: t.vacation, style: 'blockHeader', colSpan: 2 }, {}],
          [t.vacationEntitlement, String(vacation.entitlementDays)],
          [t.vacationOpening, String(vacation.openingDays)],
          [t.vacationUsed, String(vacation.usedDays)],
          [
            { text: t.vacationRemaining, bold: true },
            { text: String(vacation.remainingDays), bold: true },
          ],
          [t.absencesTotal, String(balance.absenceDaysCount)],
          [
            t.missingRecords,
            {
              text: String(input.missingDays.length),
              color: input.missingDays.length ? COLOR_NEGATIVE : undefined,
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    };

    const content: unknown[] = [
      { text: `${t.title} — ${input.employeeName}`, style: 'title' },
      {
        text: `${input.orgName}   ·   ${t.period}: ${fmtDate(input.from, locale)} – ${fmtDate(input.to, locale)}   ·   ${t.generated}: ${DateTime.now().toFormat(locale === 'DE' ? 'dd.MM.yyyy HH:mm' : 'yyyy-MM-dd HH:mm')}`,
        style: 'subtitle',
      },
      { columns: [summaryTable, vacationTable], columnGap: 16 },
    ];

    if (input.categories.length) {
      content.push({
        style: 'block',
        table: {
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: t.absences + ' — ' + t.category, style: 'blockHeader' },
              { text: t.days, style: 'blockHeader' },
              { text: t.fullDay, style: 'blockHeader' },
              { text: t.partialDay, style: 'blockHeader' },
            ],
            ...input.categories.map((c) => [
              c.name ?? '—',
              String(c.totalDays),
              String(c.fullDays),
              String(c.partialDays),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }

    if (input.missingDays.length) {
      content.push({
        style: 'block',
        text: [
          { text: `${t.missingRecords}: `, bold: true },
          {
            text: input.missingDays.map((d) => fmtDate(d, locale)).join(', '),
            color: COLOR_NEGATIVE,
          },
        ],
      });
    }

    if (input.contracts.length) {
      content.push({
        style: 'block',
        table: {
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: t.contracts, style: 'blockHeader' },
              { text: t.workload, style: 'blockHeader' },
              { text: t.weeklyHours, style: 'blockHeader' },
              { text: t.from, style: 'blockHeader' },
              { text: t.to, style: 'blockHeader' },
            ],
            ...input.contracts.map((c) => [
              c.position ?? '—',
              c.workloadPercent != null ? `${c.workloadPercent}%` : '—',
              c.weeklyHours != null ? String(c.weeklyHours) : '—',
              fmtDate(c.startDate, locale),
              c.endDate ? fmtDate(c.endDate, locale) : t.open,
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }

    // Monats-Tabellen
    const byMonth = new Map<string, LedgerDayRow[]>();
    for (const row of input.dayRows) {
      const key = row.date.slice(0, 7);
      const list = byMonth.get(key) ?? [];
      list.push(row);
      byMonth.set(key, list);
    }

    for (const [month, rows] of byMonth) {
      const monthLabel = DateTime.fromISO(`${month}-01`)
        .setLocale(locale === 'DE' ? 'de-CH' : 'en')
        .toFormat('LLLL yyyy');
      const monthTotal = rows.reduce((s, r) => s + r.difference_minutes, 0);
      content.push({
        text: monthLabel,
        style: 'monthHeader',
        pageBreak: undefined,
      });
      content.push({
        style: 'block',
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: t.date, style: 'blockHeader' },
              { text: t.entry, style: 'blockHeader' },
              { text: t.planned, style: 'blockHeader' },
              { text: t.actual, style: 'blockHeader' },
              { text: t.workTime, style: 'blockHeader' },
              { text: t.difference, style: 'blockHeader' },
            ],
            ...rows.map((r) => {
              const label = this.dayLabel(r, t);
              const segments =
                input.segmentsByDate.get(r.date)?.join(', ') ?? '';
              const diffText = r.overtime_capped
                ? `${fmtMinutes(r.difference_minutes, true)} (${t.cappedBy} ${fmtMinutes(r.capped_minutes)})`
                : fmtMinutes(r.difference_minutes, true);
              const muted = r.is_weekend || r.is_no_contract;
              return [
                {
                  text: fmtDate(r.date, locale),
                  color: muted ? COLOR_MUTED : undefined,
                },
                { text: label, color: muted ? COLOR_MUTED : undefined },
                fmtMinutes(r.planned_minutes),
                fmtMinutes(r.actual_minutes),
                { text: segments, fontSize: 8 },
                {
                  text: diffText,
                  color:
                    r.difference_minutes < 0
                      ? COLOR_NEGATIVE
                      : r.difference_minutes > 0
                        ? COLOR_POSITIVE
                        : undefined,
                },
              ];
            }),
            [
              { text: t.monthTotal, bold: true, colSpan: 5 },
              {},
              {},
              {},
              {},
              {
                text: fmtMinutes(monthTotal, true),
                bold: true,
                color: balColor(monthTotal),
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      footer: (currentPage: number, pageCount: number) => ({
        text: `${t.page} ${currentPage} ${t.of} ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: COLOR_MUTED,
      }),
      content,
      styles: {
        title: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
        subtitle: {
          fontSize: 9,
          color: COLOR_MUTED,
          margin: [0, 0, 0, 12],
        },
        block: { margin: [0, 4, 0, 10], fontSize: 9 },
        blockHeader: { bold: true, fontSize: 9 },
        monthHeader: { fontSize: 12, bold: true, margin: [0, 8, 0, 2] },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 9 },
    };
  }
}
