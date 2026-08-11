import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EmployeeContract } from './entities/employee-contract.entity';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';
import {
  assertContractTypeFields,
  clearHiddenContractFields,
  type ContractTypeDependentField,
} from './contract-type-rules';
import { applyExclusiveScheduleFields } from './contract-schedule';

@Injectable()
export class EmployeeContractsService {
  constructor(
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new contract and closes any overlapping predecessor so periods
   * never overlap: previous.endDate = day before the new startDate.
   */
  async create(
    input: CreateEmployeeContractInput,
    organizationId: string,
    hiddenByPermission?: ReadonlySet<ContractTypeDependentField>,
  ): Promise<EmployeeContract> {
    assertContractTypeFields(input, input.contractType, hiddenByPermission);

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(EmployeeContract);

      const previous = await this.closeOverlappingPredecessor(
        repo,
        input.employeeId,
        organizationId,
        input.startDate,
      );

      const contract = repo.create({
        ...input,
        organizationId,
        previousContractId: previous?.id ?? null,
      });
      applyExclusiveScheduleFields(contract);
      clearHiddenContractFields(contract, contract.contractType);
      return repo.save(contract);
    });
  }

  async findAllByOrgId(organizationId: string): Promise<EmployeeContract[]> {
    return this.contractRepo.find({
      where: { organizationId, isActive: true },
      relations: ['employee'],
      order: { startDate: 'DESC' },
    });
  }

  async findAllByEmployeeId(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeContract[]> {
    return this.contractRepo.find({
      where: { organizationId, employeeId, isActive: true },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<EmployeeContract> {
    const contract = await this.contractRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['employee'],
    });
    if (!contract) {
      throw new NotFoundException(`EmployeeContract ${id} not found`);
    }
    return contract;
  }

  async update(
    input: UpdateEmployeeContractInput,
    organizationId: string,
    hiddenByPermission?: ReadonlySet<ContractTypeDependentField>,
  ): Promise<EmployeeContract> {
    const previous = await this.findOne(input.id, organizationId);

    if (!input.startDate) {
      throw new BadRequestException(
        'startDate is required to create a new contract version',
      );
    }

    const newStartDate = input.startDate;
    if (newStartDate < previous.startDate) {
      throw new BadRequestException(
        'New contract startDate must not be before the previous contract startDate',
      );
    }

    const { id: _ignored, ...incoming } = input;

    const merged: Partial<EmployeeContract> = {
      organizationId,
      employeeId: previous.employeeId,
      startDate: newStartDate,
      endDate: incoming.endDate ?? null,
      probationEndDate: incoming.probationEndDate ?? null,
      contractType: incoming.contractType ?? previous.contractType,
      position: incoming.position ?? previous.position,
      supervisorMembershipId:
        incoming.supervisorMembershipId !== undefined
          ? incoming.supervisorMembershipId
          : previous.supervisorMembershipId,
      workloadPercent: incoming.workloadPercent ?? previous.workloadPercent,
      weeklyHours: incoming.weeklyHours ?? previous.weeklyHours,
      grossSalary: incoming.grossSalary ?? previous.grossSalary,
      hourlyRate: incoming.hourlyRate ?? previous.hourlyRate,
      paymentInterval: incoming.paymentInterval ?? previous.paymentInterval,
      has13thSalary: incoming.has13thSalary ?? previous.has13thSalary,
      annualVacationDays:
        incoming.annualVacationDays ?? previous.annualVacationDays,
      remainingVacationDays:
        incoming.remainingVacationDays ?? previous.remainingVacationDays,
      notes: incoming.notes ?? previous.notes,
      documentUrl: incoming.documentUrl ?? previous.documentUrl,
      weekdayTimeWindows:
        incoming.weekdayTimeWindows !== undefined
          ? incoming.weekdayTimeWindows
          : previous.weekdayTimeWindows,
      weekdayWorkloads:
        incoming.weekdayWorkloads !== undefined
          ? incoming.weekdayWorkloads
          : previous.weekdayWorkloads,
    };

    // Exact clock times take precedence — keep the two schedule modes exclusive.
    // Empty `{}` must not wipe workloads; only real window entries count.
    applyExclusiveScheduleFields(merged);

    assertContractTypeFields(merged, merged.contractType, hiddenByPermission);
    clearHiddenContractFields(merged, merged.contractType);

    // Same effective date → correct the current row in place. A later start
    // date versions the contract (end previous day before, insert successor).
    if (newStartDate === previous.startDate) {
      Object.assign(previous, merged);
      return this.contractRepo.save(previous);
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(EmployeeContract);

      previous.endDate = this.dayBefore(newStartDate);
      await repo.save(previous);

      return repo.save(
        repo.create({
          ...merged,
          previousContractId: previous.id,
        }),
      );
    });
  }

  /**
   * Ends the chronologically previous open/overlapping contract so the new
   * period starts cleanly the day after. Returns that predecessor (for
   * `previousContractId`) or null when this is the first contract.
   */
  private async closeOverlappingPredecessor(
    repo: Repository<EmployeeContract>,
    employeeId: string,
    organizationId: string,
    newStartDate: string,
  ): Promise<EmployeeContract | null> {
    const previous = await repo.findOne({
      where: { employeeId, organizationId, isActive: true },
      order: { startDate: 'DESC' },
    });
    if (!previous) return null;

    if (newStartDate <= previous.startDate) {
      throw new BadRequestException(
        'New contract startDate must be after the previous contract startDate',
      );
    }

    // Open-ended or ending on/after the new start → would overlap; close it.
    if (!previous.endDate || previous.endDate >= newStartDate) {
      previous.endDate = this.dayBefore(newStartDate);
      await repo.save(previous);
    }

    return previous;
  }

  private dayBefore(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const contract = await this.findOne(id, organizationId);
    contract.isActive = false;
    await this.contractRepo.save(contract);
    return true;
  }
}
