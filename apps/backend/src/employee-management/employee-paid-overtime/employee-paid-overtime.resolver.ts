import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeePaidOvertimeService } from './employee-paid-overtime.service';
import { EmployeePaidOvertime } from './entities/employee-paid-overtime.entity';
import { CreateEmployeePaidOvertimeInput } from './dto/create-employee-paid-overtime.input';
import { UpdateEmployeePaidOvertimeInput } from './dto/update-employee-paid-overtime.input';

/** Ausbezahlte Überzeit — HR/Admin-only (payroll-sensitiv). */
@Resolver(() => EmployeePaidOvertime)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
@AdminPersonaOnly()
export class EmployeePaidOvertimeResolver {
  constructor(private readonly service: EmployeePaidOvertimeService) {}

  @Query(() => [EmployeePaidOvertime], { name: 'employeePaidOvertime' })
  @Permissions('TIMESHEET_READ')
  employeePaidOvertime(
    @CurrentOrgId() orgId: string,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ) {
    return this.service.findByEmployee(orgId, employeeId);
  }

  @Mutation(() => EmployeePaidOvertime)
  @Permissions('EMPLOYEE_WRITE')
  createEmployeePaidOvertime(
    @Args('input') input: CreateEmployeePaidOvertimeInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.create(input, orgId, user.membershipId);
  }

  @Mutation(() => EmployeePaidOvertime)
  @Permissions('EMPLOYEE_WRITE')
  updateEmployeePaidOvertime(
    @Args('input') input: UpdateEmployeePaidOvertimeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteEmployeePaidOvertime(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.remove(id, orgId);
  }
}
