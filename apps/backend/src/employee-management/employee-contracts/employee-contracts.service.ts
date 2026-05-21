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

@Injectable()
export class EmployeeContractsService {
  constructor(
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    input: CreateEmployeeContractInput,
    organizationId: string,
  ): Promise<EmployeeContract> {
    const contract = this.contractRepo.create({
      ...input,
      organizationId,
    });
    return this.contractRepo.save(contract);
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
  ): Promise<EmployeeContract> {
    const previous = await this.findOne(input.id, organizationId);

    if (!input.startDate) {
      throw new BadRequestException(
        'startDate is required to create a new contract version',
      );
    }

    const newStartDate = input.startDate;
    if (newStartDate <= previous.startDate) {
      throw new BadRequestException(
        'New contract startDate must be after the previous contract startDate',
      );
    }

    const { id: _ignored, ...incoming } = input;

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(EmployeeContract);

      previous.endDate = this.dayBefore(newStartDate);
      await repo.save(previous);

      const next = repo.create({
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
        paymentInterval: incoming.paymentInterval ?? previous.paymentInterval,
        has13thSalary: incoming.has13thSalary ?? previous.has13thSalary,
        annualVacationDays:
          incoming.annualVacationDays ?? previous.annualVacationDays,
        remainingVacationDays:
          incoming.remainingVacationDays ?? previous.remainingVacationDays,
        notes: incoming.notes ?? previous.notes,
        previousContractId: previous.id,
      });

      return repo.save(next);
    });
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
