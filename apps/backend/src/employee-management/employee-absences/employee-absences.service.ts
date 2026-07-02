import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeeAbsenceCategory } from '../employee-absence-categories/entities/employee-absence-category.entity';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { UpdateEmployeeAbsenceInput } from './dto/update-employee-absence.input';
import { EmployeeAbsence } from './entities/employee-absence.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { daysInterval } from '@/common/utils/days-interval';
import { EmployeeAbsenceDay } from './entities/employee-absence-days.entity';
import { DateTime } from 'luxon';
import { GoogleCalendarService } from '@/google/google-calendar.service';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';

/** 'YYYY-MM-DD' aus einem (timestamptz-)Date. */
function toIsoDate(d: Date): string {
  return DateTime.fromJSDate(d).toISODate() as string;
}

@Injectable()
export class EmployeeAbsencesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly access: TimeTrackingAccessService,
    private readonly periods: TimeTrackingPeriodsService,
  ) {}

  async createEmployeeAbsenceNotice(
    input: CreateEmployeeAbsenceNoticeInput,
    user: TokenPayload,
  ) {
    const {
      startDate,
      endDate,
      note,
      absenceCategoryId,
      isTeamInformed,
      isVacationCapable,
    } = input;
    const { orgId, membershipId } = user;
    await this.periods.assertRangeUnlocked(
      orgId as string,
      startDate,
      endDate ?? startDate,
    );
    const employeeAbsenceSaved = await this.entityManager.transaction(
      async (manager) => {
        const organization = await manager.findOne(Organization, {
          where: {
            id: orgId,
          },
        });
        if (!organization)
          throw new NotFoundException('Organization not found!');

        // Find Absence Category — org-scoped (Multi-Tenant)
        const absenceCategory = await manager.findOne(EmployeeAbsenceCategory, {
          where: {
            id: absenceCategoryId,
            organizationId: orgId,
          },
        });
        if (!absenceCategory)
          throw new NotFoundException('Absenzcategory not found!');

        // Find Employee on Membership
        const membership = await manager.findOne(Membership, {
          where: {
            id: membershipId,
          },
          relations: ['employee', 'user'],
        });
        if (!membership) throw new NotFoundException('Membership not found.');

        const employeeAbsence = manager.create(EmployeeAbsence, {
          organization,
          membership,
          employee: membership.employee,
          absenceCategory,
          startDate: new Date(startDate),
          endDate: new Date(endDate ?? startDate),
          note,
          isTeamInformed,
          // Ferienfaehigkeit: explizite Eingabe gewinnt, sonst Kategorie-Default
          isVacationCapable:
            isVacationCapable ?? absenceCategory.defaultIsVacationCapable,
          // Abwesenheitsgrad: explizite Eingabe gewinnt, sonst Kategorie-Default
          percentage: input.percentage ?? absenceCategory.defaultPercentage,
        });
        const employeeAbsenceSaved = await manager.save(employeeAbsence);

        const days = daysInterval(
          employeeAbsenceSaved.startDate,
          employeeAbsenceSaved.endDate,
        );

        const absenceDays = days.map((luxonDate: DateTime) => {
          const day = new EmployeeAbsenceDay();
          day.employeeAbsence = employeeAbsenceSaved;
          day.employee = employeeAbsenceSaved.employee;
          day.organization = employeeAbsenceSaved.organization;
          day.absenceCategory = employeeAbsenceSaved.absenceCategory;
          day.date = luxonDate.toJSDate();
          return day;
        });

        await manager.save(EmployeeAbsenceDay, absenceDays);

        const absenceCategoryLabels: Record<string, string> = {
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
        const category = absenceCategory.systemCode!;

        const germanLabel = absenceCategoryLabels[category];

        const calenderRes = await this.googleCalendarService.createAbsenceEvent(
          {
            summary: `${membership.user?.firstName} ${membership.user?.lastName} ${germanLabel}`,
            description: `${employeeAbsenceSaved.note}`,
            start: DateTime.fromJSDate(
              employeeAbsenceSaved.startDate,
            ).toJSDate(),
            end: DateTime.fromJSDate(employeeAbsenceSaved.endDate)
              .plus({ days: 1 })
              .toJSDate(),
            allDay: true,
          },
        );

        console.log(calenderRes);
        return employeeAbsenceSaved;
      },
    );

    // Ledger nach Commit neu rechnen (betroffener Mitarbeiter + Datumsbereich).
    await this.balanceRecompute.recomputeRange(
      orgId as string,
      employeeAbsenceSaved.employee.id,
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

  async updateEmployeeAbsence(
    input: UpdateEmployeeAbsenceInput,
    user: TokenPayload,
  ): Promise<EmployeeAbsence> {
    const orgId = user.orgId as string;
    const absence = await this.findOneOrFail(input.id, orgId);
    await this.access.assertCanManageEmployee(user, absence.employeeId);

    const prevStart = toIsoDate(absence.startDate);
    const prevEnd = toIsoDate(absence.endDate ?? absence.startDate);
    await this.periods.assertRangeUnlocked(orgId, prevStart, prevEnd);

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

    const newStart = toIsoDate(absence.startDate);
    const newEnd = toIsoDate(absence.endDate);
    await this.periods.assertRangeUnlocked(orgId, newStart, newEnd);

    const saved = await this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(EmployeeAbsence, absence);
      // Tages-Detail neu aufbauen (Bereich/Kategorie können sich geändert haben).
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
            date: luxonDate.toJSDate(),
          }),
      );
      await manager.save(EmployeeAbsenceDay, days);
      return saved;
    });

    // Union aus altem und neuem Bereich neu rechnen.
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
    await this.access.assertCanManageEmployee(user, absence.employeeId);

    const start = toIsoDate(absence.startDate);
    const end = toIsoDate(absence.endDate ?? absence.startDate);
    await this.periods.assertRangeUnlocked(orgId, start, end);

    await this.entityManager.transaction(async (manager) => {
      absence.isActive = false;
      await manager.save(EmployeeAbsence, absence);
      await manager.delete(EmployeeAbsenceDay, {
        employeeAbsenceId: absence.id,
        organizationId: orgId,
      });
    });

    await this.balanceRecompute.recomputeRange(
      orgId,
      absence.employeeId,
      start,
      end,
    );
    return true;
  }
}
