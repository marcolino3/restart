import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyVacationAssignment } from './entities/company-vacation-assignment.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { BalanceRecomputeService } from '@/employee-management/work-time-calculation/balance-recompute.service';
import { TimeTrackingPeriodsService } from '@/employee-management/time-tracking-periods/time-tracking-periods.service';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { toCurrentPeriodSegments } from '@/employee-management/work-time-calculation/to-period-segments';
import { EmployeeCompanyVacation } from './entities/employee-company-vacation.entity';

@Injectable()
export class CompanyVacationAssignmentsService {
  constructor(
    @InjectRepository(CompanyVacationAssignment)
    private readonly assignmentRepo: Repository<CompanyVacationAssignment>,
    @InjectRepository(CompanyVacation)
    private readonly companyVacationRepo: Repository<CompanyVacation>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly periodsService: TimeTrackingPeriodsService,
  ) {}

  private async assertEmployeeInOrg(
    employeeId: string,
    organizationId: string,
  ): Promise<void> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, membership: { organizationId } },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
  }

  async assign(
    companyVacationId: string,
    employeeId: string,
    organizationId: string,
  ): Promise<CompanyVacationAssignment> {
    await this.assertEmployeeInOrg(employeeId, organizationId);
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
    await this.assertEmployeeInOrg(employeeId, organizationId);
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
    await this.assertEmployeeInOrg(employeeId, organizationId);
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

    const segments = toCurrentPeriodSegments(
      vacations.map((vacation) => ({
        id: vacation.id,
        name: vacation.name,
        startDate: vacation.startDate,
        endDate: vacation.endDate,
      })),
      anchor,
      holidays,
    );

    return segments.map((segment) => ({
      id: segment.id,
      companyVacationId: segment.sourceId,
      name: segment.name as string,
      startDate: segment.startDate,
      endDate: segment.endDate,
      effectiveDays: segment.effectiveDays,
      holidays: segment.holidays,
      periodLabel: segment.periodLabel,
      periodStartDate: segment.periodStartDate,
      periodEndDate: segment.periodEndDate,
      isSplit: segment.isSplit,
    }));
  }
}
