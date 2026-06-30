import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeeAbsenceCategory } from '../employee-absence-categories/entities/employee-absence-category.entity';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { EmployeeAbsence } from './entities/employee-absence.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { daysInterval } from '@/common/utils/days-interval';
import { EmployeeAbsenceDay } from './entities/employee-absence-days.entity';
import { DateTime } from 'luxon';
import { GoogleCalendarService } from '@/google/google-calendar.service';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';

@Injectable()
export class EmployeeAbsencesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly balanceRecompute: BalanceRecomputeService,
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
}
