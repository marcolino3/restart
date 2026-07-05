import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import DataLoader from 'dataloader';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { WorkTimeBalanceService } from '@/employee-management/work-time-calculation/work-time-balance.service';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { EmployeeOnboardingInput } from './dto/employee-onboarding.input';
import { FinalizeEmployeeOnboardingInput } from './dto/finalize-employee-onboarding.input';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { UpdateEmployeeInput } from './dto/update-employee.input';

/** 'YYYY-MM-DD' von heute (Serverzeit). */
function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Per-Request DataLoader für die Employee-Field-Resolver (Pensum, Zeitsaldo).
 * Liegt auf dem GraphQL-Context, weil orgId und Aufrufer je Request konstant
 * sind — so wird die Liste in je einer Query gebatcht statt N+1.
 */
interface EmployeeFieldLoaders {
  workload: DataLoader<string, number | null>;
  balance: DataLoader<string, number | null>;
}
type LoaderContext = { __employeeFieldLoaders?: EmployeeFieldLoaders };

@Resolver(() => Employee)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeesResolver {
  constructor(
    private readonly employeesService: EmployeesService,
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    private readonly balanceService: WorkTimeBalanceService,
  ) {}

  private loaders(
    ctx: LoaderContext,
    orgId: string,
    user: TokenPayload,
  ): EmployeeFieldLoaders {
    if (!ctx.__employeeFieldLoaders) {
      ctx.__employeeFieldLoaders = {
        workload: new DataLoader((ids) =>
          this.batchWorkloadPercent(orgId, ids),
        ),
        balance: new DataLoader((ids) => this.batchBalance(user, ids)),
      };
    }
    return ctx.__employeeFieldLoaders;
  }

  /** Pensum (%) des aktuell gültigen Vertrags je Mitarbeiter. */
  private async batchWorkloadPercent(
    orgId: string,
    employeeIds: readonly string[],
  ): Promise<(number | null)[]> {
    const today = todayIso();
    const contracts = await this.contractRepo.find({
      where: {
        organizationId: orgId,
        employeeId: In(employeeIds as string[]),
        isActive: true,
        startDate: LessThanOrEqual(today),
      },
      order: { startDate: 'DESC' },
    });
    // startDate DESC → der erste Vertrag je Mitarbeiter ist der aktuell gültige.
    const byEmp = new Map<string, EmployeeContract>();
    for (const c of contracts) {
      if (!byEmp.has(c.employeeId)) byEmp.set(c.employeeId, c);
    }
    return employeeIds.map((id) => {
      const c = byEmp.get(id);
      if (!c || c.workloadPercent == null) return null;
      return Math.round(Number(c.workloadPercent));
    });
  }

  private async batchBalance(
    user: TokenPayload,
    employeeIds: readonly string[],
  ): Promise<(number | null)[]> {
    const map = await this.balanceService.getListNetBalanceMinutes(
      user,
      employeeIds as string[],
    );
    return employeeIds.map((id) => map.get(id) ?? null);
  }

  @ResolveField(() => Int, { name: 'workloadPercent', nullable: true })
  workloadPercent(
    @Parent() employee: Employee,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Context() ctx: LoaderContext,
  ): Promise<number | null> {
    return this.loaders(ctx, orgId, user).workload.load(employee.id);
  }

  /**
   * Netto-Arbeitszeitsaldo (Minuten, bis heute). Nur für Mitarbeiter mit
   * aktivierter Zeiterfassung; Zugriff wird im Balance-Service gescoped.
   */
  @ResolveField(() => Int, { name: 'timeBalanceMinutes', nullable: true })
  timeBalanceMinutes(
    @Parent() employee: Employee,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Context() ctx: LoaderContext,
  ): Promise<number | null> | null {
    if (!employee.timeTrackingEnabled) return null;
    return this.loaders(ctx, orgId, user).balance.load(employee.id);
  }

  @Mutation(() => Employee, { name: 'createEmployee' })
  @Permissions('EMPLOYEE_WRITE')
  @AdminPersonaOnly()
  createEmployee(
    @Args('createEmployeeInput') createEmployeeInput: CreateEmployeeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeesService.createEmployeeMinimal(
      createEmployeeInput,
      orgId,
    );
  }

  @Mutation(() => Employee, { name: 'updateEmployee' })
  @Permissions('EMPLOYEE_WRITE')
  @AdminPersonaOnly()
  updateEmployee(
    @Args('updateEmployeeInput') updateEmployeeInput: UpdateEmployeeInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() actor?: TokenPayload,
  ) {
    return this.employeesService.updateEmployeeMinimal(
      updateEmployeeInput,
      orgId,
      actor?.membershipId ?? null,
    );
  }

  @Mutation(() => Employee, { name: 'upsertEmployeeOnboardingDraft' })
  @Permissions('EMPLOYEE_WRITE')
  @AdminPersonaOnly()
  upsertEmployeeOnboardingDraft(
    @Args('input') input: EmployeeOnboardingInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeesService.upsertEmployeeOnboardingDraft(input, orgId);
  }

  @Mutation(() => Employee, { name: 'finalizeEmployeeOnboarding' })
  @Permissions('EMPLOYEE_WRITE')
  @AdminPersonaOnly()
  finalizeEmployeeOnboarding(
    @Args('input') input: FinalizeEmployeeOnboardingInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeesService.finalizeEmployeeOnboarding(input, orgId);
  }

  @Mutation(() => Employee, { name: 'sendEmployeeInvitation' })
  @Permissions('EMPLOYEE_WRITE')
  @AdminPersonaOnly()
  sendEmployeeInvitation(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeesService.sendEmployeeInvitation(employeeId, orgId);
  }

  @Query(() => [Employee], { name: 'employeesByOrgId' })
  @Permissions('EMPLOYEE_READ')
  async findEmployeesByOrgId(@CurrentOrgId() organizationId: string) {
    return this.employeesService.findEmployeesByOrgId(organizationId);
  }

  @Query(() => [Employee], { name: 'teachersByOrgId' })
  @Permissions('SCHOOL_CLASS_READ')
  async findTeachersByOrgId(@CurrentOrgId() organizationId: string) {
    return this.employeesService.findTeachersByOrgId(organizationId);
  }

  @Query(() => Employee, { name: 'employeeById' })
  @Permissions('EMPLOYEE_READ')
  @AdminPersonaOnly()
  async findEmployeeById(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() organizationId: string,
  ) {
    return this.employeesService.findEmployeeById(employeeId, organizationId);
  }
}
