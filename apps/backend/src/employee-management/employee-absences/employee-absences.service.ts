import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeeAbsenceCategory } from '../employee-absence-categories/entities/employee-absence-category.entity';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { CreateEmployeeAbsenceInput } from './dto/create-employee-absence.input';
import { UpdateEmployeeAbsenceInput } from './dto/update-employee-absence.input';
import { AbsenceDocument } from './entities/absence-document.type';
import { EmployeeAbsence } from './entities/employee-absence.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { daysInterval } from '@/common/utils/days-interval';
import { EmployeeAbsenceDay } from './entities/employee-absence-days.entity';
import { DateTime } from 'luxon';
import { GoogleCalendarService } from '@/google/google-calendar.service';
import { StorageService } from '@/storage/storage.service';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { Employee } from '../employees/entities/employee.entity';

/** 'YYYY-MM-DD' aus einem (timestamptz-)Date. */
function toIsoDate(d: Date): string {
  return DateTime.fromJSDate(d).toISODate() as string;
}

const ABSENCE_DOC_URL_RE = /^\/api\/absence-certificates\/[a-zA-Z0-9.-]+$/;

const ABSENCE_CATEGORY_LABELS: Record<string, string> = {
  SICKNESS: 'Krankheit',
  ACCIDENT: 'Unfall',
  CHILDCARE_SICK: 'Kind krank',
  TRAINING: 'Weiterbildung',
  FUNERAL: 'Beerdigung',
  MOVE: 'Umzug',
  MILITARY_SERVICE: 'Militärdienst',
  CIVIL_SERVICE: 'Zivildienst',
  OTHER: 'Sonstiges',
};

@Injectable()
export class EmployeeAbsencesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly googleCalendarService: GoogleCalendarService,
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

    return this.createAbsenceForMembership({
      input,
      user,
      orgId: orgId as string,
      membership,
      employee: membership.employee,
      certificates: [],
      additionalDocuments: [],
    });
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
  }) {
    const {
      input,
      orgId,
      membership,
      employee,
      certificates,
      additionalDocuments,
    } = args;
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

    const employeeAbsenceSaved = await this.entityManager.transaction(
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
        });
        const saved = await manager.save(employeeAbsence);

        const days = daysInterval(saved.startDate, saved.endDate);
        const absenceDays = days.map((luxonDate: DateTime) => {
          const day = new EmployeeAbsenceDay();
          day.employeeAbsence = saved;
          day.employee = saved.employee;
          day.organization = saved.organization;
          day.absenceCategory = saved.absenceCategory;
          day.date = luxonDate.toISODate() as unknown as Date;
          return day;
        });
        await manager.save(EmployeeAbsenceDay, absenceDays);

        const germanLabel =
          ABSENCE_CATEGORY_LABELS[absenceCategory.systemCode ?? ''] ??
          absenceCategory.systemCode ??
          'Absenz';

        try {
          await this.googleCalendarService.createAbsenceEvent({
            summary: `${membership.user?.firstName} ${membership.user?.lastName} ${germanLabel}`,
            description: `${saved.note ?? ''}`,
            start: DateTime.fromJSDate(saved.startDate).toJSDate(),
            end: DateTime.fromJSDate(saved.endDate)
              .plus({ days: 1 })
              .toJSDate(),
            allDay: true,
          });
        } catch {
          // Calendar sync is best-effort; absence itself is already saved.
        }

        return saved;
      },
    );

    await this.balanceRecompute.recomputeRange(
      orgId,
      employeeAbsenceSaved.employeeId ?? employee.id,
      startDate,
      endDate ?? startDate,
    );

    return employeeAbsenceSaved;
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

    const saved = await this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(EmployeeAbsence, absence);
      await manager.delete(EmployeeAbsenceDay, {
        employeeAbsenceId: saved.id,
        organizationId: orgId,
      });
      const days = daysInterval(saved.startDate, saved.endDate).map(
        (luxonDate: DateTime) =>
          manager.create(EmployeeAbsenceDay, {
            employeeAbsenceId: saved.id,
            employeeId: saved.employeeId,
            organizationId: orgId,
            absenceCategoryId: saved.absenceCategoryId,
            date: luxonDate.toISODate() as unknown as Date,
          }),
      );
      await manager.save(EmployeeAbsenceDay, days);
      return saved;
    });

    const nextDocs = [
      ...(saved.certificates ?? []),
      ...(saved.additionalDocuments ?? []),
    ];
    await this.deleteOrphanedDocuments(orgId, previousDocs, nextDocs);

    const from = prevStart < newStart ? prevStart : newStart;
    const to = prevEnd > newEnd ? prevEnd : newEnd;
    await this.balanceRecompute.recomputeRange(
      orgId,
      saved.employeeId,
      from,
      to,
    );
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

    await this.balanceRecompute.recomputeRange(
      orgId,
      absence.employeeId,
      start,
      end,
    );
    return true;
  }
}
