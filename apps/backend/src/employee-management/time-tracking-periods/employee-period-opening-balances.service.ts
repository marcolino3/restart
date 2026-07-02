import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeePeriodOpeningBalance } from './entities/employee-period-opening-balance.entity';
import { TimeTrackingPeriod } from './entities/time-tracking-period.entity';
import { UpsertEmployeePeriodOpeningBalanceInput } from './dto/upsert-employee-period-opening-balance.input';

@Injectable()
export class EmployeePeriodOpeningBalancesService {
  constructor(
    @InjectRepository(EmployeePeriodOpeningBalance)
    private readonly repo: Repository<EmployeePeriodOpeningBalance>,
    @InjectRepository(TimeTrackingPeriod)
    private readonly periodRepo: Repository<TimeTrackingPeriod>,
  ) {}

  findByEmployee(
    organizationId: string,
    employeeId: string,
  ): Promise<EmployeePeriodOpeningBalance[]> {
    return this.repo.find({
      where: { organizationId, employeeId, isActive: true },
      relations: { period: true },
      order: { period: { startDate: 'DESC' } },
    });
  }

  /**
   * Creates or updates the opening balance for (employeeId, periodId).
   * The period must belong to the caller's organization.
   */
  async upsert(
    input: UpsertEmployeePeriodOpeningBalanceInput,
    organizationId: string,
  ): Promise<EmployeePeriodOpeningBalance> {
    const period = await this.periodRepo.findOne({
      where: { id: input.periodId, organizationId, isActive: true },
    });
    if (!period) {
      throw new NotFoundException(
        `TimeTrackingPeriod ${input.periodId} not found`,
      );
    }

    // Include soft-deleted rows: the unique constraint on
    // (employeeId, periodId) would otherwise block re-creation.
    const existing = await this.repo.findOne({
      where: {
        organizationId,
        employeeId: input.employeeId,
        periodId: input.periodId,
      },
    });

    if (existing) {
      existing.openingWorkMinutes = input.openingWorkMinutes;
      existing.openingVacationDays = input.openingVacationDays;
      existing.isActive = true;
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      ...input,
      organizationId,
    });
    return this.repo.save(entity);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const entity = await this.repo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!entity) {
      throw new NotFoundException(
        `EmployeePeriodOpeningBalance ${id} not found`,
      );
    }
    entity.isActive = false;
    await this.repo.save(entity);
    return true;
  }
}
