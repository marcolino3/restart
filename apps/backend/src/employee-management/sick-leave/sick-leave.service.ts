import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { EntityManager } from 'typeorm';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { EmployeeAbsenceCategory } from '../employee-absence-categories/entities/employee-absence-category.entity';
import { SystemEmployeeAbsenceCategory } from '../employee-absence-categories/interfaces/system-employee-absence-categories.enum';
import { AbsenceCalendarSyncService } from '../employee-absences/absence-calendar-sync.service';
import { absenceCategoryLabel } from '../employee-absences/employee-absences.service';
import { EmployeeAbsenceDay } from '../employee-absences/entities/employee-absence-days.entity';
import { EmployeeAbsence } from '../employee-absences/entities/employee-absence.entity';
import { Holiday } from '../holidays/entities/holiday.entity';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { findHolidayForDate } from '../work-time-calculation/work-time-calculation';
import { ReportSickLeaveInput } from './dto/report-sick-leave.input';
import { SickLeaveNotificationService } from './sick-leave-notification.service';
import { SICK_LEAVE_SETTING_KEYS } from './sick-leave-setting-keys';

/**
 * Categories a follow-up report may silently extend. Everything else keeps the
 * strict overlap guard of the regular absence flow — merging e.g. a training
 * absence into a sickness would falsify the record.
 */
const MERGEABLE_CATEGORIES: ReadonlySet<string> = new Set([
  SystemEmployeeAbsenceCategory.SICKNESS,
  SystemEmployeeAbsenceCategory.ACCIDENT,
]);

/** How far back a mergeable absence may reach to still be a candidate. */
const MERGE_LOOKBACK_DAYS = 30;

export interface ReportSickLeaveResult {
  absence: EmployeeAbsence;
  /** True when an existing absence was extended instead of a new one created. */
  isExtension: boolean;
  /** True when the day was already covered and nothing changed. */
  isUnchanged: boolean;
}

@Injectable()
export class SickLeaveService {
  private readonly logger = new Logger(SickLeaveService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly periods: TimeTrackingPeriodsService,
    private readonly calendarSync: AbsenceCalendarSyncService,
    private readonly notifications: SickLeaveNotificationService,
    private readonly organizationSettings: OrganizationSettingsService,
  ) {}

  /**
   * Self-service sick report for the calling employee. The organization and
   * membership always come from the token, never from the input — a caller can
   * only ever report for themselves, in their own tenant.
   */
  async reportSickLeave(
    input: ReportSickLeaveInput,
    user: TokenPayload,
  ): Promise<ReportSickLeaveResult> {
    const organizationId = user.orgId as string;

    const membership = await this.entityManager.findOne(Membership, {
      where: { id: user.membershipId, organizationId },
      relations: ['employee', 'user'],
    });
    if (!membership?.employee) {
      throw new NotFoundException('Membership not found.');
    }
    const employee = membership.employee;

    const category = await this.entityManager.findOne(EmployeeAbsenceCategory, {
      where: {
        organizationId,
        systemCode: SystemEmployeeAbsenceCategory.SICKNESS,
        isActive: true,
      },
    });
    if (!category) {
      throw new ServiceUnavailableException(
        'No sickness absence category configured for this organization.',
      );
    }

    const date = parseIsoDate(input.date);
    await this.periods.assertRangeUnlocked(
      organizationId,
      input.date,
      input.date,
    );

    const result = await this.persist({
      organizationId,
      employeeId: employee.id,
      membership,
      category,
      date,
      input,
    });

    await this.runSideEffects(result, {
      organizationId,
      employeeId: employee.id,
      employeeName:
        `${membership.user?.firstName ?? ''} ${membership.user?.lastName ?? ''}`.trim(),
      categorySystemCode: category.systemCode,
      comment: input.comment ?? null,
    });

    return result;
  }

  /** Decide between idempotent no-op, extension and fresh absence, then write. */
  private async persist(params: {
    organizationId: string;
    employeeId: string;
    membership: Membership;
    category: EmployeeAbsenceCategory;
    date: Date;
    input: ReportSickLeaveInput;
  }): Promise<ReportSickLeaveResult> {
    const { organizationId, employeeId, membership, category, date, input } =
      params;

    const candidate = await this.findMergeCandidate(
      organizationId,
      employeeId,
      date,
    );

    if (candidate && isWithinRange(candidate, date)) {
      // Day already covered — report is a duplicate. Nothing changes and no
      // notification goes out, otherwise repeated taps would spam leadership.
      return { absence: candidate, isExtension: false, isUnchanged: true };
    }

    if (candidate && (await this.isGapless(organizationId, candidate, date))) {
      const extended = await this.extend(candidate, date, category, input);
      return { absence: extended, isExtension: true, isUnchanged: false };
    }

    const created = await this.create({
      organizationId,
      membership,
      employeeId,
      category,
      date,
      input,
    });
    return { absence: created, isExtension: false, isUnchanged: false };
  }

  /**
   * Most recent active SICKNESS/ACCIDENT absence that ends on or before the
   * reported day, within the lookback window.
   */
  private async findMergeCandidate(
    organizationId: string,
    employeeId: string,
    date: Date,
  ): Promise<EmployeeAbsence | null> {
    const lookbackStart = DateTime.fromJSDate(date)
      .minus({ days: MERGE_LOOKBACK_DAYS })
      .toJSDate();

    const candidates = await this.entityManager
      .createQueryBuilder(EmployeeAbsence, 'absence')
      .leftJoinAndSelect('absence.absenceCategory', 'category')
      .where('absence.organization_id = :organizationId', { organizationId })
      .andWhere('absence.employee_id = :employeeId', { employeeId })
      .andWhere('absence."isActive" = true')
      .andWhere('absence."startDate" <= :date', { date })
      .andWhere('absence."endDate" >= :lookbackStart', { lookbackStart })
      .orderBy('absence."endDate"', 'DESC')
      .limit(5)
      .getMany();

    return (
      candidates.find((absence) =>
        MERGEABLE_CATEGORIES.has(absence.absenceCategory?.systemCode ?? ''),
      ) ?? null
    );
  }

  /**
   * True when every calendar day between the candidate's end and the reported
   * day is a non-working day (weekend or org holiday) — i.e. the employee has
   * not been back at work in between.
   */
  private async isGapless(
    organizationId: string,
    candidate: EmployeeAbsence,
    date: Date,
  ): Promise<boolean> {
    const end = DateTime.fromJSDate(candidate.endDate ?? candidate.startDate);
    const target = DateTime.fromJSDate(date);
    if (target <= end) return true;

    const holidays = await this.entityManager.find(Holiday, {
      where: { organizationId, isActive: true },
    });
    const calcHolidays = holidays.map((h) => ({
      date: h.date,
      paidPercentage: h.paidPercentage,
      repeatsYearly: h.repeatsYearly,
    }));

    for (let d = end.plus({ days: 1 }); d < target; d = d.plus({ days: 1 })) {
      const isoDate = d.toISODate() as string;
      const isWeekend = d.weekday > 5;
      const isHoliday = Boolean(findHolidayForDate(calcHolidays, isoDate));
      if (!isWeekend && !isHoliday) return false;
    }
    return true;
  }

  /** Extend the candidate to the new end date and backfill its absence days. */
  private async extend(
    candidate: EmployeeAbsence,
    date: Date,
    category: EmployeeAbsenceCategory,
    input: ReportSickLeaveInput,
  ): Promise<EmployeeAbsence> {
    return this.entityManager.transaction(async (manager) => {
      const previousEnd = DateTime.fromJSDate(
        candidate.endDate ?? candidate.startDate,
      );

      candidate.endDate = date;
      candidate.note = appendComment(candidate.note, date, input.comment);
      // A mid-day start only ever describes the FIRST day of an absence, so an
      // extension must not overwrite it.
      const saved = await manager.save(EmployeeAbsence, candidate);

      const newDays: EmployeeAbsenceDay[] = [];
      for (
        let d = previousEnd.plus({ days: 1 });
        d <= DateTime.fromJSDate(date);
        d = d.plus({ days: 1 })
      ) {
        const day = new EmployeeAbsenceDay();
        day.employeeAbsenceId = saved.id;
        day.employeeId = saved.employeeId;
        day.organizationId = saved.organizationId;
        day.absenceCategoryId = category.id;
        day.date = d.toISODate() as unknown as Date;
        newDays.push(day);
      }
      if (newDays.length > 0) {
        await manager.save(EmployeeAbsenceDay, newDays);
      }

      return saved;
    });
  }

  /** Fresh absence, keeping the strict overlap guard of the regular flow. */
  private async create(params: {
    organizationId: string;
    membership: Membership;
    employeeId: string;
    category: EmployeeAbsenceCategory;
    date: Date;
    input: ReportSickLeaveInput;
  }): Promise<EmployeeAbsence> {
    const { organizationId, membership, employeeId, category, date, input } =
      params;

    return this.entityManager.transaction(async (manager) => {
      const organization = await manager.findOne(Organization, {
        where: { id: organizationId },
      });
      if (!organization) throw new NotFoundException('Organization not found!');

      const overlapping = await manager
        .createQueryBuilder(EmployeeAbsence, 'absence')
        .where('absence.organization_id = :organizationId', { organizationId })
        .andWhere('absence.employee_id = :employeeId', { employeeId })
        .andWhere('absence."isActive" = true')
        .andWhere('absence."startDate" <= :date', { date })
        .andWhere('absence."endDate" >= :date', { date })
        .getOne();
      if (overlapping) {
        throw new BadRequestException(
          'This employee already has an absence recorded for the selected day.',
        );
      }

      const absence = manager.create(EmployeeAbsence, {
        organization,
        organizationId,
        membership,
        membershipId: membership.id,
        employeeId,
        absenceCategory: category,
        absenceCategoryId: category.id,
        startDate: date,
        endDate: date,
        startTime: input.startTime ? `${input.startTime}:00` : null,
        note: appendComment(undefined, date, input.comment),
        isTeamInformed: false,
        isVacationCapable: category.defaultIsVacationCapable,
        percentage: category.defaultPercentage,
        certificates: [],
        additionalDocuments: [],
      });
      const saved = await manager.save(absence);

      const day = new EmployeeAbsenceDay();
      day.employeeAbsenceId = saved.id;
      day.employeeId = employeeId;
      day.organizationId = organizationId;
      day.absenceCategoryId = category.id;
      day.date = DateTime.fromJSDate(date).toISODate() as unknown as Date;
      await manager.save(EmployeeAbsenceDay, day);

      return saved;
    });
  }

  /**
   * Calendar mirror and notification mails. Both run AFTER the transaction has
   * committed and neither may fail the report — the absence is already saved.
   */
  private async runSideEffects(
    result: ReportSickLeaveResult,
    context: {
      organizationId: string;
      employeeId: string;
      employeeName: string;
      categorySystemCode: string | null;
      comment: string | null;
    },
  ): Promise<void> {
    if (result.isUnchanged) return;

    const { absence } = result;

    if (await this.isCalendarEnabled(context.organizationId)) {
      await this.calendarSync.sync({
        organizationId: context.organizationId,
        absenceId: absence.id,
        employeeName: context.employeeName,
        absenceLabel: absenceCategoryLabel(context.categorySystemCode),
        startDate: absence.startDate,
        endDate: absence.endDate ?? absence.startDate,
        startTime: absence.startTime,
        note: absence.note,
      });
    }

    await this.notifications.notify({
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      employeeName: context.employeeName,
      startDate: absence.startDate,
      endDate: absence.endDate ?? absence.startDate,
      startTime: absence.startTime,
      comment: context.comment,
      isExtension: result.isExtension,
    });
  }

  /** Calendar sync is opt-in per org; unset counts as enabled when configured. */
  private async isCalendarEnabled(organizationId: string): Promise<boolean> {
    try {
      const raw = await this.organizationSettings.getDecryptedValue(
        organizationId,
        SICK_LEAVE_SETTING_KEYS.calendarEnabled,
      );
      return raw?.trim().toLowerCase() !== 'false';
    } catch (error) {
      this.logger.warn(
        `Could not read calendar toggle for organization ${organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}

/** `YYYY-MM-DD` to a Date at local midnight — absences are day-granular. */
function parseIsoDate(value: string): Date {
  const parsed = DateTime.fromISO(value.slice(0, 10));
  if (!parsed.isValid) {
    throw new BadRequestException('Invalid date.');
  }
  return parsed.startOf('day').toJSDate();
}

function isWithinRange(absence: EmployeeAbsence, date: Date): boolean {
  const start = DateTime.fromJSDate(absence.startDate).startOf('day');
  const end = DateTime.fromJSDate(absence.endDate ?? absence.startDate).startOf(
    'day',
  );
  const target = DateTime.fromJSDate(date).startOf('day');
  return target >= start && target <= end;
}

/**
 * Comments accumulate with a date prefix so an extended absence keeps the
 * history of every single report instead of losing the earlier text.
 */
function appendComment(
  existing: string | undefined | null,
  date: Date,
  comment?: string | null,
): string | undefined {
  const trimmed = comment?.trim();
  if (!trimmed) return existing ?? undefined;

  const prefix = DateTime.fromJSDate(date).toFormat('dd.MM.yyyy');
  const entry = `${prefix}: ${trimmed}`;
  return existing ? `${existing}\n${entry}` : entry;
}
