import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { EmployeeVacation } from './entities/employee-vacation.entity';
import { EmployeeVacationAccrualType } from './entities/employee-vacation-accrual-type.enum';
import { EmployeeVacationSegment } from './entities/employee-vacation-segment.entity';
import { CreateEmployeeVacationInput } from './dto/create-employee-vacation.input';
import { UpdateEmployeeVacationInput } from './dto/update-employee-vacation.input';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { toCurrentPeriodSegments } from '../work-time-calculation/to-period-segments';

@Injectable()
export class EmployeeVacationsService {
  constructor(
    @InjectRepository(EmployeeVacation)
    private readonly repo: Repository<EmployeeVacation>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
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

  /**
   * Individuelle Ferien der laufenden Abrechnungsperiode, zugeschnitten auf
   * dieses Fenster und mit Feiertagen/`effectiveDays` angereichert. Analog
   * `CompanyVacationAssignmentsService.findForEmployee`.
   */
  async findSegmentsForEmployee(
    user: TokenPayload,
    employeeId: string,
  ): Promise<EmployeeVacationSegment[]> {
    const organizationId = user.orgId as string;
    const [vacations, anchor, holidays] = await Promise.all([
      this.findByEmployee(user, employeeId),
      this.periods.getAnchor(organizationId),
      this.holidayRepo.find({ where: { organizationId, isActive: true } }),
    ]);

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
      employeeVacationId: segment.sourceId,
      name: segment.name,
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
      accrualType: input.accrualType ?? EmployeeVacationAccrualType.CHARGED,
      remark: input.remark ?? null,
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
