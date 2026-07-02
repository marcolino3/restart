import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { EmployeeVacation } from './entities/employee-vacation.entity';
import { CreateEmployeeVacationInput } from './dto/create-employee-vacation.input';
import { UpdateEmployeeVacationInput } from './dto/update-employee-vacation.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';

@Injectable()
export class EmployeeVacationsService {
  constructor(
    @InjectRepository(EmployeeVacation)
    private readonly repo: Repository<EmployeeVacation>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly balanceRecompute: BalanceRecomputeService,
    private readonly access: TimeTrackingAccessService,
    private readonly periods: TimeTrackingPeriodsService,
  ) {}

  async findByEmployee(
    user: TokenPayload,
    employeeId: string,
  ): Promise<EmployeeVacation[]> {
    await this.access.assertCanViewEmployee(user, employeeId);
    return this.repo.find({
      where: {
        organizationId: user.orgId as string,
        employeeId,
        isActive: true,
      },
      order: { startDate: 'DESC' },
    });
  }

  async create(
    input: CreateEmployeeVacationInput,
    user: TokenPayload,
  ): Promise<EmployeeVacation> {
    const organizationId = user.orgId as string;
    await this.access.assertCanManageEmployee(user, input.employeeId);
    await this.periods.assertRangeUnlocked(
      organizationId,
      input.startDate,
      input.endDate,
    );
    const membershipId = await this.resolveMembershipId(
      input.employeeId,
      organizationId,
    );
    const entity = this.repo.create({
      ...input,
      name: input.name ?? null,
      membershipId,
      organizationId,
    });
    const saved = await this.repo.save(entity);
    await this.balanceRecompute.recomputeRange(
      organizationId,
      saved.employeeId,
      saved.startDate,
      saved.endDate,
    );
    return saved;
  }

  async update(
    input: UpdateEmployeeVacationInput,
    user: TokenPayload,
  ): Promise<EmployeeVacation> {
    const organizationId = user.orgId as string;
    const entity = await this.findOne(input.id, organizationId);
    await this.access.assertCanManageEmployee(user, entity.employeeId);
    const prevStart = entity.startDate;
    const prevEnd = entity.endDate;
    const { id: _id, employeeId: _employeeId, ...rest } = input;
    Object.assign(entity, rest);
    const from = prevStart < entity.startDate ? prevStart : entity.startDate;
    const to = prevEnd > entity.endDate ? prevEnd : entity.endDate;
    await this.periods.assertRangeUnlocked(organizationId, from, to);
    const saved = await this.repo.save(entity);
    await this.balanceRecompute.recomputeRange(
      organizationId,
      saved.employeeId,
      from,
      to,
    );
    return saved;
  }

  async remove(id: string, user: TokenPayload): Promise<boolean> {
    const organizationId = user.orgId as string;
    const entity = await this.findOne(id, organizationId);
    await this.access.assertCanManageEmployee(user, entity.employeeId);
    await this.periods.assertRangeUnlocked(
      organizationId,
      entity.startDate,
      entity.endDate,
    );
    entity.isActive = false;
    await this.repo.save(entity);
    await this.balanceRecompute.recomputeRange(
      organizationId,
      entity.employeeId,
      entity.startDate,
      entity.endDate,
    );
    return true;
  }

  private async findOne(
    id: string,
    organizationId: string,
  ): Promise<EmployeeVacation> {
    const entity = await this.repo.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!entity)
      throw new NotFoundException(`EmployeeVacation ${id} not found`);
    return entity;
  }

  private async resolveMembershipId(
    employeeId: string,
    organizationId: string,
  ): Promise<string> {
    const membership = await this.membershipRepo.findOne({
      where: { employeeId, organizationId },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Membership für Mitarbeiter nicht gefunden.');
    }
    return membership.id;
  }
}
