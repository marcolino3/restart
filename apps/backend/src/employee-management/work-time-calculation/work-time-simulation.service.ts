import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeePeriodOpeningBalance } from '@/employee-management/time-tracking-periods/entities/employee-period-opening-balance.entity';
import { TimeTrackingAccessService } from './time-tracking-access.service';
import {
  BalanceInputLoaderService,
  CalcInputOverrides,
} from './balance-input-loader.service';
import { calculateDays } from './work-time-calculation';
import { WorkTimeBalance } from './dto/work-time-balance.output';

/**
 * Transiente Saldo-Vorschau für einen frei wählbaren Zeitraum, ohne das
 * Ledger (work_day_balances) zu schreiben. Nutzt dieselbe Engine wie
 * BalanceRecomputeService (via BalanceInputLoaderService), rechnet aber nur
 * im Speicher — z. B. für "was wäre bei früherem Austritt".
 *
 * Der Eröffnungssaldo wird nur übernommen, wenn `from` exakt der Start einer
 * bestehenden TimeTrackingPeriod ist (gleicher Lookup wie WorkTimeBalanceService);
 * bei frei gewähltem Start ohne Periodenbezug ist er 0.
 */
@Injectable()
export class WorkTimeSimulationService {
  constructor(
    private readonly inputLoader: BalanceInputLoaderService,
    @InjectRepository(EmployeePeriodOpeningBalance)
    private readonly openingBalanceRepo: Repository<EmployeePeriodOpeningBalance>,
    private readonly access: TimeTrackingAccessService,
  ) {}

  private async openingWorkMinutes(
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
      .select('ob.opening_work_minutes', 'min')
      .getRawOne<{ min: number }>();
    return ob?.min ?? 0;
  }

  async simulate(
    user: TokenPayload,
    employeeId: string,
    from: string,
    to: string,
    overrides?: CalcInputOverrides,
  ): Promise<WorkTimeBalance> {
    await this.access.assertCanViewEmployee(user, employeeId);
    const orgId = user.orgId as string;

    const [input, openingWorkMinutes] = await Promise.all([
      this.inputLoader.loadCalcInput(orgId, employeeId, from, to, overrides),
      this.openingWorkMinutes(orgId, employeeId, from),
    ]);
    const days = calculateDays(input);

    let plannedMinutes = 0;
    let workedMinutes = 0;
    let vacationMinutes = 0;
    let absenceMinutes = 0;
    let actualMinutes = 0;
    let differenceMinutes = 0;
    let vacationDaysUsed = 0;
    let absenceDaysCount = 0;
    for (const d of days) {
      plannedMinutes += d.plannedMinutes;
      workedMinutes += d.workedMinutes;
      vacationMinutes += d.vacationMinutes;
      absenceMinutes += d.absenceMinutes;
      actualMinutes += d.actualMinutes;
      differenceMinutes += d.differenceMinutes;
      if (d.isVacation) vacationDaysUsed += 1;
      if (d.isAbsence) absenceDaysCount += 1;
    }

    const netBalanceMinutes = differenceMinutes + openingWorkMinutes;

    return {
      employeeId,
      fromDate: from,
      toDate: to,
      plannedMinutes,
      workedMinutes,
      vacationMinutes,
      absenceMinutes,
      actualMinutes,
      differenceMinutes,
      openingWorkMinutes,
      paidOvertimeMinutes: 0,
      netBalanceMinutes,
      vacationDaysUsed,
      absenceDaysCount,
    };
  }
}
