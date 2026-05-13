import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeContract } from './entities/employee-contract.entity';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';

@Injectable()
export class EmployeeContractsService {
  constructor(
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
  ) {}

  async create(
    input: CreateEmployeeContractInput,
    organizationId: string,
  ): Promise<EmployeeContract> {
    const contract = this.contractRepo.create({
      ...input,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
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

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<EmployeeContract> {
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
    const contract = await this.findOne(input.id, organizationId);
    const { startDate, endDate, ...rest } = input;
    Object.assign(contract, rest);
    if (startDate) contract.startDate = new Date(startDate);
    if (endDate !== undefined) {
      contract.endDate = endDate ? new Date(endDate) : undefined;
    }
    return this.contractRepo.save(contract);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const contract = await this.findOne(id, organizationId);
    contract.isActive = false;
    await this.contractRepo.save(contract);
    return true;
  }
}
