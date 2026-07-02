import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { EmployeePeriodOpeningBalancesService } from './employee-period-opening-balances.service';
import { EmployeePeriodOpeningBalance } from './entities/employee-period-opening-balance.entity';
import { UpsertEmployeePeriodOpeningBalanceInput } from './dto/upsert-employee-period-opening-balance.input';

/** Opening balances (carry-over) — HR/Admin-only (payroll-sensitive). */
@Resolver(() => EmployeePeriodOpeningBalance)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
@AdminPersonaOnly()
export class EmployeePeriodOpeningBalancesResolver {
  constructor(private readonly service: EmployeePeriodOpeningBalancesService) {}

  @Query(() => [EmployeePeriodOpeningBalance], {
    name: 'employeePeriodOpeningBalances',
  })
  @Permissions('TIMESHEET_READ')
  employeePeriodOpeningBalances(
    @CurrentOrgId() orgId: string,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ) {
    return this.service.findByEmployee(orgId, employeeId);
  }

  @Mutation(() => EmployeePeriodOpeningBalance)
  @Permissions('EMPLOYEE_WRITE')
  upsertEmployeePeriodOpeningBalance(
    @Args('input') input: UpsertEmployeePeriodOpeningBalanceInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsert(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteEmployeePeriodOpeningBalance(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.remove(id, orgId);
  }
}
