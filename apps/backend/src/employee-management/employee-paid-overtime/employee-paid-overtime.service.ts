import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeePaidOvertime } from './entities/employee-paid-overtime.entity';
import { CreateEmployeePaidOvertimeInput } from './dto/create-employee-paid-overtime.input';
import { UpdateEmployeePaidOvertimeInput } from './dto/update-employee-paid-overtime.input';

@Injectable()
export class EmployeePaidOvertimeService {
  constructor(
    @InjectRepository(EmployeePaidOvertime)
    private readonly repo: Repository<EmployeePaidOvertime>,
  ) {}

  findByEmployee(
    organizationId: string,
    employeeId: string,
  ): Promise<EmployeePaidOvertime[]> {
    return this.repo.find({
      where: { organizationId, employeeId, isActive: true },
      order: { date: 'DESC' },
    });
  }

  create(
    input: CreateEmployeePaidOvertimeInput,
    organizationId: string,
    createdByMembershipId?: string,
  ): Promise<EmployeePaidOvertime> {
    const entity = this.repo.create({
      ...input,
      note: input.note ?? null,
      createdByMembershipId: createdByMembershipId ?? null,
      organizationId,
    });
    return this.repo.save(entity);
  }

  async update(
    input: UpdateEmployeePaidOvertimeInput,
    organizationId: string,
  ): Promise<EmployeePaidOvertime> {
    const entity = await this.findOne(input.id, organizationId);
    const { id: _id, employeeId: _employeeId, ...rest } = input;
    Object.assign(entity, rest);
    return this.repo.save(entity);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const entity = await this.findOne(id, organizationId);
    entity.isActive = false;
    await this.repo.save(entity);
    return true;
  }

  private async findOne(
    id: string,
    organizationId: string,
  ): Promise<EmployeePaidOvertime> {
    const entity = await this.repo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!entity) {
      throw new NotFoundException(`EmployeePaidOvertime ${id} not found`);
    }
    return entity;
  }
}
