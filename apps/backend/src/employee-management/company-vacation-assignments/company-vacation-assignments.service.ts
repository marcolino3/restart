import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyVacationAssignment } from './entities/company-vacation-assignment.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import {
  periodBoundsFor,
  periodLabel,
} from '@/employee-management/time-tracking-periods/period-bounds';
import { DateTime } from 'luxon';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import {
  calculateEffectiveVacationDays,
  listVacationHolidays,
} from '@/employee-management/work-time-calculation/work-time-calculation';
import { EmployeeCompanyVacation } from './entities/employee-company-vacation.entity';
import { splitByPeriodAnchor } from './split-by-period';

@Injectable()
export class CompanyVacationAssignmentsService {
  constructor(
    @InjectRepository(CompanyVacationAssignment)
    private readonly assignmentRepo: Repository<CompanyVacationAssignment>,
    @InjectRepository(CompanyVacation)
    private readonly companyVacationRepo: Repository<CompanyVacation>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly periodsService: TimeTrackingPeriodsService,
  ) {}

  async assign(
    companyVacationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<CompanyVacationAssignment> {
    const vacation = await this.companyVacationRepo.findOne({
      where: { id: companyVacationId, organizationId },
    });
    if (!vacation) {
      throw new NotFoundException(
        `CompanyVacation ${companyVacationId} not found`,
      );
    }

    const existing = await this.assignmentRepo.findOne({
      where: { organizationId, companyVacationId, employeeId },
    });
    if (existing) return existing;

    const assignment = this.assignmentRepo.create({
      organizationId,
      companyVacationId,
      employeeId,
    });
    const saved = await this.assignmentRepo.save(assignment);
    await this.balanceRecompute.recomputeRange(
      organizationId,
      employeeId,
      vacation.startDate,
      vacation.endDate,
    );
    return saved;
  }

  async unassign(
    companyVacationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<boolean> {
    const vacation = await this.companyVacationRepo.findOne({
      where: { id: companyVacationId, organizationId },
    });
    const result = await this.assignmentRepo.delete({
      organizationId,
      companyVacationId,
      employeeId,
    });
    const removed = (result.affected ?? 0) > 0;
    if (removed && vacation) {
      await this.balanceRecompute.recomputeRange(
        organizationId,
        employeeId,
        vacation.startDate,
        vacation.endDate,
      );
    }
    return removed;
  }

  /**
   * Zugewiesene Betriebsferien der laufenden Abrechnungsperiode (Stichtag bis
   * Vortag des nächsten Stichtags), zugeschnitten auf dieses Fenster.
   *
   * Eine Betriebsferien über den Stichtag hinweg zählt nur mit dem Teil, der in
   * die Periode fällt — `effectiveDays` und `holidays` beziehen sich auf diesen
   * Ausschnitt, `isSplit` markiert ihn. Chronologisch nach Segmentbeginn.
   */
  async findForEmployee(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeCompanyVacation[]> {
    const [assigned, anchor] = await Promise.all([
      this.assignmentRepo.find({
        where: { organizationId, employeeId },
        relations: { companyVacation: true },
      }),
      this.periodsService.getAnchor(organizationId),
    ]);

    const vacations = assigned.map((link) => link.companyVacation);

    // Feiertage einmal laden; alle Segmente rechnen rein darauf.
    const holidays = await this.holidayRepo.find({
      where: { organizationId, isActive: true },
    });

    // Laufende Periode: nur Segmente, die in dieses Fenster fallen.
    const current = periodBoundsFor(anchor, DateTime.now());
    const currentStart = current.start.toISODate() as string;

    const segments = vacations.flatMap((vacation) => {
      const parts = splitByPeriodAnchor(
        vacation.startDate,
        vacation.endDate,
        anchor,
      );
      const isSplit = parts.length > 1;
      return parts
        .filter((part) => part.periodStartDate === currentStart)
        .map((part) => ({
          id: `${vacation.id}:${part.periodStartDate}`,
          companyVacationId: vacation.id,
          name: vacation.name,
          startDate: part.startDate,
          endDate: part.endDate,
          effectiveDays: calculateEffectiveVacationDays(
            part.startDate,
            part.endDate,
            holidays,
          ),
          holidays: listVacationHolidays(
            part.startDate,
            part.endDate,
            holidays,
          ).map(({ date, holiday, isWeekend }) => ({
            date,
            name: holiday.name,
            paidPercentage: holiday.paidPercentage,
            isWeekend,
          })),
          periodLabel: periodLabel(part.periodStartDate, part.periodEndDate),
          periodStartDate: part.periodStartDate,
          periodEndDate: part.periodEndDate,
          isSplit,
        }));
    });

    // Innerhalb der Periode chronologisch nach Beginn des Segments.
    return segments.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
}
