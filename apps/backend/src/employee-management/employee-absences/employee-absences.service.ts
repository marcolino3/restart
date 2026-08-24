import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { EmployeeAbsenceCategory } from '../employee-absence-categories/entities/employee-absence-category.entity';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { CreateEmployeeAbsenceInput } from './dto/create-employee-absence.input';
import { UpdateEmployeeAbsenceInput } from './dto/update-employee-absence.input';
import { AbsenceDocument } from './entities/absence-document.type';
import { EmployeeAbsence } from './entities/employee-absence.entity';
import { EmployeeAbsenceStatus } from './entities/employee-absence-status.enum';
import { AbsenceRequestNotificationService } from './absence-request-notification.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { daysInterval } from '@/common/utils/days-interval';
import { periodBoundsFor } from '@/employee-management/time-tracking-periods/period-bounds';
import { AbsenceCategoryQuota } from './entities/absence-category-quota.type';
import { EmployeeAbsenceDay } from './entities/employee-absence-days.entity';
import { DateTime } from 'luxon';
import { AbsenceCalendarSyncService } from './absence-calendar-sync.service';
import { StorageService } from '@/storage/storage.service';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { Employee } from '../employees/entities/employee.entity';

/** 'YYYY-MM-DD' aus einem (timestamptz-)Date. */
function toIsoDate(d: Date): string {
  return DateTime.fromJSDate(d).toISODate() as string;
}

/** UTC-Tag, weil Absenzdaten als UTC-Mitternacht gespeichert werden. */
function utcDay(value: string | Date): DateTime {
  const dt =
    typeof value === 'string'
      ? DateTime.fromISO(value.slice(0, 10), { zone: 'utc' })
      : DateTime.fromJSDate(value, { zone: 'utc' });
  return dt.startOf('day');
}

/** Roles that may decide requests of ANY employee, including their own. */
const APPROVAL_ADMIN_ROLES: ReadonlySet<string> = new Set([
  SystemRole.ORG_ADMIN,
  SystemRole.HR_MANAGER,
]);

const ABSENCE_DOC_URL_RE = /^\/api\/absence-certificates\/[a-zA-Z0-9.-]+$/;

export const ABSENCE_CATEGORY_LABELS: Record<string, string> = {
  VACATION: 'Ferien',
  SICKNESS: 'Krankheit',
  ACCIDENT: 'Unfall',
  CHILDCARE_SICK: 'Kind krank',
  TRAINING: 'Weiterbildung',
  FUNERAL: 'Beerdigung',
  MOVE: 'Umzug',
  MILITARY_SERVICE: 'Militärdienst',
  CIVIL_SERVICE: 'Zivildienst',
  COMPENSATION: 'Kompensation',
  UNPAID_LEAVE: 'Unbezahlter Urlaub',
  OTHER: 'Sonstiges',
};

/** German calendar/label wording for a system category code. */
export function absenceCategoryLabel(systemCode?: string | null): string {
  return ABSENCE_CATEGORY_LABELS[systemCode ?? ''] ?? systemCode ?? 'Absenz';
}

@Injectable()
export class EmployeeAbsencesService {
  private readonly logger = new Logger(EmployeeAbsencesService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly calendarSync: AbsenceCalendarSyncService,
    private readonly requestNotifications: AbsenceRequestNotificationService,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly access: TimeTrackingAccessService,
    private readonly periods: TimeTrackingPeriodsService,
    private readonly storage: StorageService,
  ) {}

  async findAllByEmployeeId(
    employeeId: string,
    user: TokenPayload,
  ): Promise<EmployeeAbsence[]> {
    const orgId = user.orgId as string;
    await this.access.assertCanViewEmployee(user, employeeId);
    return this.entityManager.find(EmployeeAbsence, {
      where: { organizationId: orgId, employeeId, isActive: true },
      relations: ['absenceCategory', 'absenceCategory.translations'],
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Self-service list: the caller's own absences. No permission code — the
   * employee is resolved from the token's membership, never from an argument,
   * so a caller can only ever read their own records.
   */
  async findAllForCaller(user: TokenPayload): Promise<EmployeeAbsence[]> {
    const orgId = user.orgId as string;
    const membership = await this.entityManager.findOne(Membership, {
      where: { id: user.membershipId, organizationId: orgId },
      relations: ['employee'],
    });
    // A caller without an employee record (e.g. a SuperAdmin browsing an org
    // they are not staffed in) simply has no own absences — not an error.
    if (!membership?.employee) {
      return [];
    }
    return this.entityManager.find(EmployeeAbsence, {
      where: {
        organizationId: orgId,
        employeeId: membership.employee.id,
        isActive: true,
      },
      relations: ['absenceCategory', 'absenceCategory.translations'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string, user: TokenPayload): Promise<EmployeeAbsence> {
    const orgId = user.orgId as string;
    const absence = await this.findOneOrFail(id, orgId);
    await this.access.assertCanViewEmployee(user, absence.employeeId);
    return this.entityManager.findOneOrFail(EmployeeAbsence, {
      where: { id, organizationId: orgId, isActive: true },
      relations: ['absenceCategory', 'absenceCategory.translations'],
    });
  }

  async createEmployeeAbsenceNotice(
    input: CreateEmployeeAbsenceNoticeInput,
    user: TokenPayload,
  ) {
    const { orgId, membershipId } = user;
    const membership = await this.entityManager.findOne(Membership, {
      where: { id: membershipId },
      relations: ['employee', 'user'],
    });
    if (!membership?.employee) {
      throw new NotFoundException('Membership not found.');
    }

    const category = await this.entityManager.findOne(EmployeeAbsenceCategory, {
      where: {
        id: input.absenceCategoryId,
        organizationId: orgId as string,
        isActive: true,
      },
    });
    if (!category) throw new NotFoundException('Absenzcategory not found!');

    // Self-service rules: a plain notice only covers today or tomorrow and is
    // definitive at once; a request may lie anywhere in the future but waits
    // for a decision.
    const start = utcDay(input.startDate);
    const today = DateTime.utc().startOf('day');
    if (start < today) {
      throw new BadRequestException(
        'Absences cannot be reported for days in the past.',
      );
    }
    if (!category.requiresApproval && start > today.plus({ days: 1 })) {
      throw new BadRequestException(
        'This absence category can only be reported for today or tomorrow.',
      );
    }
    const end = utcDay(input.endDate ?? input.startDate);
    if (end < start) {
      throw new BadRequestException('End date must not be before start date.');
    }
    if (!category.allowsDateRange && end > start) {
      throw new BadRequestException(
        'This absence category only allows single-day absences.',
      );
    }
    const requestedDays = Math.round(end.diff(start, 'days').days) + 1;
    if (
      category.maxDaysPerRequest != null &&
      requestedDays > category.maxDaysPerRequest
    ) {
      throw new BadRequestException(
        `This absence category allows at most ${category.maxDaysPerRequest} days per request.`,
      );
    }
    // Yearly cap only guards self-service; admins may exceed it deliberately
    // via createEmployeeAbsence.
    await this.assertYearlyCap(
      orgId as string,
      membership.employee.id,
      category,
      start,
      end,
    );

    const absence = await this.createAbsenceForMembership({
      input,
      user,
      orgId: orgId as string,
      membership,
      employee: membership.employee,
      certificates: [],
      additionalDocuments: [],
      status: category.requiresApproval
        ? EmployeeAbsenceStatus.PENDING
        : EmployeeAbsenceStatus.APPROVED,
    });

    if (absence.status === EmployeeAbsenceStatus.PENDING) {
      await this.safely('request notification', () =>
        this.requestNotifications.notifyRequested({
          organizationId: orgId as string,
          employeeId: absence.employeeId,
          employeeName: membershipName(membership),
          categoryLabel: absenceCategoryLabel(category.systemCode),
          startDate: absence.startDate,
          endDate: absence.endDate ?? absence.startDate,
          note: absence.note,
        }),
      );
    }
    return absence;
  }

  /** Admin/HR/Team-Lead(self-scope)/Self: create absence for an employee. */
  async createEmployeeAbsence(
    input: CreateEmployeeAbsenceInput,
    user: TokenPayload,
  ) {
    const orgId = user.orgId as string;
    await this.access.assertCanManageAbsence(user, input.employeeId);

    const employee = await this.entityManager.findOne(Employee, {
      where: {
        id: input.employeeId,
        membership: { organizationId: orgId },
      },
      relations: ['membership', 'membership.user'],
    });
    if (!employee?.membership) {
      throw new NotFoundException('Employee not found!');
    }

    const certificates = this.assertValidDocuments(input.certificates ?? []);
    const additionalDocuments = this.assertValidDocuments(
      input.additionalDocuments ?? [],
    );

    return this.createAbsenceForMembership({
      input,
      user,
      orgId,
      membership: employee.membership,
      employee,
      certificates,
      additionalDocuments,
      status: EmployeeAbsenceStatus.APPROVED,
    });
  }

  private async createAbsenceForMembership(args: {
    input: CreateEmployeeAbsenceNoticeInput;
    user: TokenPayload;
    orgId: string;
    membership: Membership;
    employee: Employee;
    certificates: EmployeeAbsence['certificates'];
    additionalDocuments: EmployeeAbsence['additionalDocuments'];
    status: EmployeeAbsenceStatus;
  }) {
    const {
      input,
      orgId,
      membership,
      employee,
      certificates,
      additionalDocuments,
      status,
    } = args;
    const isApproved = status === EmployeeAbsenceStatus.APPROVED;
    const {
      startDate,
      endDate,
      note,
      absenceCategoryId,
      isTeamInformed,
      isVacationCapable,
    } = input;

    await this.periods.assertRangeUnlocked(
      orgId,
      startDate,
      endDate ?? startDate,
    );

    const transactionResult = await this.entityManager.transaction(
      async (manager) => {
        const organization = await manager.findOne(Organization, {
          where: { id: orgId },
        });
        if (!organization) {
          throw new NotFoundException('Organization not found!');
        }

        const absenceCategory = await manager.findOne(EmployeeAbsenceCategory, {
          where: { id: absenceCategoryId, organizationId: orgId },
        });
        if (!absenceCategory) {
          throw new NotFoundException('Absenzcategory not found!');
        }

        const overlapping = await manager
          .createQueryBuilder(EmployeeAbsence, 'absence')
          .where('absence.employee_id = :employeeId', {
            employeeId: employee.id,
          })
          .andWhere('absence."isActive" = true')
          .andWhere('absence.status <> :rejected', {
            rejected: EmployeeAbsenceStatus.REJECTED,
          })
          .andWhere('absence."startDate" <= :endDate', {
            endDate: new Date(endDate ?? startDate),
          })
          .andWhere('absence."endDate" >= :startDate', {
            startDate: new Date(startDate),
          })
          .getOne();
        if (overlapping) {
          throw new BadRequestException(
            'This employee already has an absence recorded for one of the selected days.',
          );
        }

        const employeeAbsence = manager.create(EmployeeAbsence, {
          organization,
          membership,
          employee,
          absenceCategory,
          startDate: new Date(startDate),
          endDate: new Date(endDate ?? startDate),
          note,
          isTeamInformed,
          isVacationCapable:
            isVacationCapable ?? absenceCategory.defaultIsVacationCapable,
          percentage: input.percentage ?? absenceCategory.defaultPercentage,
          certificates,
          additionalDocuments,
          status,
          requestedAt: isApproved ? null : new Date(),
        });
        const saved = await manager.save(employeeAbsence);

        // Absence days only exist for definitive absences: they feed balances
        // and reports, and a pending request must not count anywhere yet.
        if (isApproved) {
          await this.writeAbsenceDays(manager, saved);
        }

        return { saved, absenceCategory };
      },
    );

    const { saved: employeeAbsenceSaved, absenceCategory } = transactionResult;

    if (!isApproved) return employeeAbsenceSaved;

    await this.balanceRecompute.recomputeRange(
      orgId,
      employeeAbsenceSaved.employeeId ?? employee.id,
      startDate,
      endDate ?? startDate,
    );

    // Calendar mirroring is an admin setting on the category.
    if (absenceCategory.syncToCalendar === false) return employeeAbsenceSaved;

    // Calendar sync runs AFTER the commit: it is an outbound HTTP call and must
    // never hold a database transaction open, nor fail the saved absence.
    await this.calendarSync.sync({
      organizationId: orgId,
      absenceId: employeeAbsenceSaved.id,
      employeeName:
        `${membership.user?.firstName ?? ''} ${membership.user?.lastName ?? ''}`.trim(),
      absenceLabel: absenceCategoryLabel(absenceCategory.systemCode),
      titleTemplate: absenceCategory.calendarTitleTemplate ?? null,
      startDate: employeeAbsenceSaved.startDate,
      endDate: employeeAbsenceSaved.endDate,
      startTime: employeeAbsenceSaved.startTime,
      note: employeeAbsenceSaved.note,
    });

    return employeeAbsenceSaved;
  }

  /** Rewrites the per-day rows of an absence (delete + insert). */
  private async writeAbsenceDays(
    manager: EntityManager,
    absence: EmployeeAbsence,
  ): Promise<void> {
    await manager.delete(EmployeeAbsenceDay, {
      employeeAbsenceId: absence.id,
      organizationId: absence.organizationId,
    });
    const days = daysInterval(
      absence.startDate,
      absence.endDate ?? absence.startDate,
    ).map((luxonDate: DateTime) =>
      manager.create(EmployeeAbsenceDay, {
        employeeAbsenceId: absence.id,
        employeeId: absence.employeeId,
        organizationId: absence.organizationId,
        absenceCategoryId: absence.absenceCategoryId,
        date: luxonDate.toISODate() as unknown as Date,
      }),
    );
    await manager.save(EmployeeAbsenceDay, days);
  }

  /** Side effects after commit: log and swallow, never fail the mutation. */
  private async safely(label: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(`Absence ${label} failed`, error as Error);
    }
  }

  /**
   * Open requests the caller may decide: every employee for ORG_ADMIN/HR,
   * the led teams for a TEAM_LEAD, nothing for everyone else.
   */
  /**
   * Approved + pending days of one category that fall inside the org period
   * (anchor day, see TimeTrackingPeriodsService) containing `date`. Counts
   * calendar days from the absence rows themselves because pending requests
   * have no employee_absence_days yet.
   */
  private async computeYearlyUsage(
    orgId: string,
    employeeId: string,
    absenceCategoryId: string,
    date: DateTime,
    excludeAbsenceId?: string,
  ): Promise<{ usedDays: number; periodStart: DateTime; periodEnd: DateTime }> {
    const anchor = await this.periods.getAnchor(orgId);
    const { start: periodStart, end: periodEnd } = periodBoundsFor(
      anchor,
      date,
    );
    const qb = this.entityManager
      .createQueryBuilder(EmployeeAbsence, 'absence')
      .where('absence.organization_id = :orgId', { orgId })
      .andWhere('absence.employee_id = :employeeId', { employeeId })
      .andWhere('absence.absence_category_id = :absenceCategoryId', {
        absenceCategoryId,
      })
      .andWhere('absence."isActive" = true')
      .andWhere('absence.status IN (:...statuses)', {
        statuses: [
          EmployeeAbsenceStatus.APPROVED,
          EmployeeAbsenceStatus.PENDING,
        ],
      })
      .andWhere('absence."startDate" <= :periodEnd', {
        periodEnd: periodEnd.endOf('day').toJSDate(),
      })
      .andWhere(
        'COALESCE(absence."endDate", absence."startDate") >= :periodStart',
        {
          periodStart: periodStart.startOf('day').toJSDate(),
        },
      );
    if (excludeAbsenceId) {
      qb.andWhere('absence.id <> :excludeAbsenceId', { excludeAbsenceId });
    }
    const rows = await qb.getMany();
    let usedDays = 0;
    for (const row of rows) {
      const s = DateTime.max(utcDay(row.startDate), periodStart);
      const e = DateTime.min(utcDay(row.endDate ?? row.startDate), periodEnd);
      if (e < s) continue;
      usedDays += Math.round(e.diff(s, 'days').days) + 1;
    }
    return { usedDays, periodStart, periodEnd };
  }

  /**
   * Hard cap of `maxDaysPerYear` per category and org period. A request that
   * spans the anchor day is checked against both periods it touches.
   */
  private async assertYearlyCap(
    orgId: string,
    employeeId: string,
    category: EmployeeAbsenceCategory,
    start: DateTime,
    end: DateTime,
  ): Promise<void> {
    if (category.maxDaysPerYear == null) return;
    let cursor = start;
    while (cursor <= end) {
      const { usedDays, periodEnd } = await this.computeYearlyUsage(
        orgId,
        employeeId,
        category.id,
        cursor,
      );
      const sliceEnd = DateTime.min(end, periodEnd);
      const requested = Math.round(sliceEnd.diff(cursor, 'days').days) + 1;
      if (usedDays + requested > category.maxDaysPerYear) {
        const remaining = Math.max(category.maxDaysPerYear - usedDays, 0);
        throw new BadRequestException(
          `ABSENCE_YEARLY_CAP: only ${remaining} of ${category.maxDaysPerYear} days left for this category in the current period.`,
        );
      }
      cursor = periodEnd.plus({ days: 1 });
    }
  }

  /** Self-service: remaining allowance of a category for the caller. */
  async getMyCategoryQuota(
    absenceCategoryId: string,
    date: string | undefined,
    user: TokenPayload,
  ): Promise<AbsenceCategoryQuota> {
    const { orgId, membershipId } = user;
    const membership = await this.entityManager.findOne(Membership, {
      where: { id: membershipId },
      relations: ['employee'],
    });
    if (!membership?.employee) {
      throw new NotFoundException('Membership not found.');
    }
    const category = await this.entityManager.findOne(EmployeeAbsenceCategory, {
      where: { id: absenceCategoryId, organizationId: orgId as string },
    });
    if (!category) throw new NotFoundException('Absenzcategory not found!');

    const reference = date ? utcDay(date) : DateTime.utc().startOf('day');
    const { usedDays, periodStart, periodEnd } = await this.computeYearlyUsage(
      orgId as string,
      membership.employee.id,
      category.id,
      reference,
    );
    return {
      absenceCategoryId: category.id,
      maxDaysPerYear: category.maxDaysPerYear,
      usedDays,
      remainingDays:
        category.maxDaysPerYear == null
          ? null
          : Math.max(category.maxDaysPerYear - usedDays, 0),
      periodStart: periodStart.toISODate() as string,
      periodEnd: periodEnd.toISODate() as string,
    };
  }

  async findPendingRequests(user: TokenPayload): Promise<EmployeeAbsence[]> {
    const orgId = user.orgId as string;
    const scope = await this.access.resolveOverviewScope(user, orgId);
    if (scope !== null && scope.length === 0) return [];
    return this.entityManager.find(EmployeeAbsence, {
      where: {
        organizationId: orgId,
        isActive: true,
        status: EmployeeAbsenceStatus.PENDING,
        ...(scope ? { employeeId: In(scope) } : {}),
      },
      relations: [
        'absenceCategory',
        'absenceCategory.translations',
        'employee',
        'employee.membership',
        'employee.membership.user',
      ],
      order: { requestedAt: 'ASC' },
    });
  }

  async approveEmployeeAbsence(
    id: string,
    note: string | null | undefined,
    user: TokenPayload,
  ): Promise<EmployeeAbsence> {
    return this.decide(id, true, note ?? null, user);
  }

  async rejectEmployeeAbsence(
    id: string,
    note: string | null | undefined,
    user: TokenPayload,
  ): Promise<EmployeeAbsence> {
    if (!note?.trim()) {
      throw new BadRequestException(
        'A reason is required to reject a request.',
      );
    }
    return this.decide(id, false, note.trim(), user);
  }

  private async decide(
    id: string,
    approved: boolean,
    note: string | null,
    user: TokenPayload,
  ): Promise<EmployeeAbsence> {
    const orgId = user.orgId as string;
    const absence = await this.findOneOrFail(id, orgId);
    await this.access.assertCanManageAbsence(user, absence.employeeId);

    if (absence.status !== EmployeeAbsenceStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be decided.');
    }

    // A lead must not approve their own request; admins/HR may.
    const callerMembership = await this.entityManager.findOne(Membership, {
      where: { id: user.membershipId, organizationId: orgId },
      relations: ['user'],
    });
    const isApprovalAdmin =
      user.isSuperAdmin ||
      (user.roles ?? []).some((r) => APPROVAL_ADMIN_ROLES.has(r));
    if (
      !isApprovalAdmin &&
      callerMembership?.employeeId === absence.employeeId
    ) {
      throw new ForbiddenException('You cannot decide your own request.');
    }

    const start = toIsoDate(absence.startDate);
    const end = toIsoDate(absence.endDate ?? absence.startDate);
    await this.periods.assertRangeUnlocked(orgId, start, end);

    absence.status = approved
      ? EmployeeAbsenceStatus.APPROVED
      : EmployeeAbsenceStatus.REJECTED;
    absence.decidedAt = new Date();
    absence.decidedByMembershipId = callerMembership?.id ?? null;
    absence.decisionNote = note;

    const saved = await this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(EmployeeAbsence, absence);
      if (approved) await this.writeAbsenceDays(manager, saved);
      return saved;
    });

    const requester = await this.entityManager.findOne(Membership, {
      where: { id: saved.membershipId, organizationId: orgId },
      relations: ['user'],
    });
    const employeeName = requester ? membershipName(requester) : '';
    const categoryLabel = absenceCategoryLabel(
      saved.absenceCategory?.systemCode,
    );

    if (approved) {
      await this.balanceRecompute.recomputeRange(
        orgId,
        saved.employeeId,
        start,
        end,
      );
      if (saved.absenceCategory?.syncToCalendar !== false) {
        await this.safely('calendar sync', () =>
          this.calendarSync.sync({
            organizationId: orgId,
            absenceId: saved.id,
            employeeName,
            absenceLabel: categoryLabel,
            titleTemplate: saved.absenceCategory?.calendarTitleTemplate ?? null,
            startDate: saved.startDate,
            endDate: saved.endDate,
            startTime: saved.startTime,
            note: saved.note,
          }),
        );
      }
    }

    await this.safely('decision notification', () =>
      this.requestNotifications.notifyDecided({
        organizationId: orgId,
        employeeId: saved.employeeId,
        employeeName,
        categoryLabel,
        startDate: saved.startDate,
        endDate: saved.endDate ?? saved.startDate,
        note: saved.note,
        approved,
        deciderName: callerMembership ? membershipName(callerMembership) : null,
        decisionNote: note,
      }),
    );

    return saved;
  }

  /** Self-service: withdraw an own, still pending request (soft delete). */
  async withdrawMyAbsenceRequest(
    id: string,
    user: TokenPayload,
  ): Promise<boolean> {
    const orgId = user.orgId as string;
    const absence = await this.entityManager.findOne(EmployeeAbsence, {
      where: {
        id,
        organizationId: orgId,
        membershipId: user.membershipId,
        isActive: true,
      },
    });
    if (!absence) throw new NotFoundException('Absence not found!');
    if (absence.status !== EmployeeAbsenceStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be withdrawn.');
    }
    absence.isActive = false;
    await this.entityManager.save(EmployeeAbsence, absence);
    return true;
  }

  /** Absenz laden (org-scoped, aktiv) oder 404. */
  private async findOneOrFail(
    id: string,
    organizationId: string,
  ): Promise<EmployeeAbsence> {
    const absence = await this.entityManager.findOne(EmployeeAbsence, {
      where: { id, organizationId, isActive: true },
      relations: ['absenceCategory'],
    });
    if (!absence) throw new NotFoundException('Absence not found!');
    return absence;
  }

  private assertValidDocuments(
    docs: AbsenceDocument[] | null | undefined,
  ): AbsenceDocument[] {
    const list = docs ?? [];
    for (const doc of list) {
      if (!ABSENCE_DOC_URL_RE.test(doc.url)) {
        throw new BadRequestException(
          'Invalid absence document URL — only uploaded certificates are allowed',
        );
      }
    }
    return list;
  }

  private fileIdFromUrl(url: string): string | null {
    const match = url.match(ABSENCE_DOC_URL_RE);
    return match ? url.slice('/api/absence-certificates/'.length) : null;
  }

  private storageKey(orgId: string, fileId: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9.-]/g, '');
    return `absence-certificates/${safeOrg}/${safeFile}`;
  }

  /** Best-effort: remove blobs that are no longer referenced. */
  private async deleteOrphanedDocuments(
    orgId: string,
    previous: AbsenceDocument[],
    next: AbsenceDocument[],
  ): Promise<void> {
    const keep = new Set(next.map((d) => d.url));
    for (const doc of previous) {
      if (keep.has(doc.url)) continue;
      const fileId = this.fileIdFromUrl(doc.url);
      if (!fileId) continue;
      try {
        await this.storage.delete(this.storageKey(orgId, fileId));
      } catch {
        // Orphan cleanup must not fail the absence mutation.
      }
    }
  }

  async updateEmployeeAbsence(
    input: UpdateEmployeeAbsenceInput,
    user: TokenPayload,
  ): Promise<EmployeeAbsence> {
    const orgId = user.orgId as string;
    const absence = await this.findOneOrFail(input.id, orgId);
    await this.access.assertCanManageAbsence(user, absence.employeeId);

    const prevStart = toIsoDate(absence.startDate);
    const prevEnd = toIsoDate(absence.endDate ?? absence.startDate);
    await this.periods.assertRangeUnlocked(orgId, prevStart, prevEnd);

    const previousDocs = [
      ...(absence.certificates ?? []),
      ...(absence.additionalDocuments ?? []),
    ];

    if (
      input.absenceCategoryId &&
      input.absenceCategoryId !== absence.absenceCategoryId
    ) {
      const category = await this.entityManager.findOne(
        EmployeeAbsenceCategory,
        { where: { id: input.absenceCategoryId, organizationId: orgId } },
      );
      if (!category) throw new NotFoundException('Absenzcategory not found!');
      absence.absenceCategory = category;
      absence.absenceCategoryId = category.id;
    }
    if (input.startDate) absence.startDate = new Date(input.startDate);
    if (input.endDate) absence.endDate = new Date(input.endDate);
    if (absence.endDate == null || absence.endDate < absence.startDate) {
      absence.endDate = absence.startDate;
    }
    if (input.note !== undefined) absence.note = input.note;
    if (input.isTeamInformed !== undefined) {
      absence.isTeamInformed = input.isTeamInformed;
    }
    if (input.isVacationCapable !== undefined) {
      absence.isVacationCapable = input.isVacationCapable;
    }
    if (input.percentage !== undefined) absence.percentage = input.percentage;
    if (input.certificates !== undefined) {
      absence.certificates = this.assertValidDocuments(input.certificates);
    }
    if (input.additionalDocuments !== undefined) {
      absence.additionalDocuments = this.assertValidDocuments(
        input.additionalDocuments,
      );
    }

    const newStart = toIsoDate(absence.startDate);
    const newEnd = toIsoDate(absence.endDate);
    await this.periods.assertRangeUnlocked(orgId, newStart, newEnd);

    const isApproved = absence.status === EmployeeAbsenceStatus.APPROVED;
    const saved = await this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(EmployeeAbsence, absence);
      if (isApproved) await this.writeAbsenceDays(manager, saved);
      return saved;
    });

    const nextDocs = [
      ...(saved.certificates ?? []),
      ...(saved.additionalDocuments ?? []),
    ];
    await this.deleteOrphanedDocuments(orgId, previousDocs, nextDocs);

    if (isApproved) {
      const from = prevStart < newStart ? prevStart : newStart;
      const to = prevEnd > newEnd ? prevEnd : newEnd;
      await this.balanceRecompute.recomputeRange(
        orgId,
        saved.employeeId,
        from,
        to,
      );
    }
    return saved;
  }

  async deleteEmployeeAbsence(
    id: string,
    user: TokenPayload,
  ): Promise<boolean> {
    const orgId = user.orgId as string;
    const absence = await this.findOneOrFail(id, orgId);
    await this.access.assertCanManageAbsence(user, absence.employeeId);

    const start = toIsoDate(absence.startDate);
    const end = toIsoDate(absence.endDate ?? absence.startDate);
    await this.periods.assertRangeUnlocked(orgId, start, end);

    const docs = [
      ...(absence.certificates ?? []),
      ...(absence.additionalDocuments ?? []),
    ];

    await this.entityManager.transaction(async (manager) => {
      absence.isActive = false;
      await manager.save(EmployeeAbsence, absence);
      await manager.delete(EmployeeAbsenceDay, {
        employeeAbsenceId: absence.id,
        organizationId: orgId,
      });
    });

    await this.deleteOrphanedDocuments(orgId, docs, []);

    if (absence.status === EmployeeAbsenceStatus.APPROVED) {
      await this.balanceRecompute.recomputeRange(
        orgId,
        absence.employeeId,
        start,
        end,
      );
    }
    return true;
  }
}

function membershipName(membership: Membership): string {
  return `${membership.user?.firstName ?? ''} ${membership.user?.lastName ?? ''}`.trim();
}
