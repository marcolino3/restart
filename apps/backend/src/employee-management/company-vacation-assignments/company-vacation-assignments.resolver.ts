import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CompanyVacationAssignmentsService } from './company-vacation-assignments.service';
import { CompanyVacationAssignment } from './entities/company-vacation-assignment.entity';
import { EmployeeCompanyVacation } from './entities/employee-company-vacation.entity';

@Resolver(() => CompanyVacationAssignment)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CompanyVacationAssignmentsResolver {
  constructor(private readonly service: CompanyVacationAssignmentsService) {}

  @Query(() => [EmployeeCompanyVacation], {
    name: 'companyVacationsForEmployee',
  })
  @Permissions('TIMESHEET_READ')
  companyVacationsForEmployee(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findForEmployee(employeeId, orgId);
  }

  @Mutation(() => CompanyVacationAssignment)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  assignCompanyVacationToEmployee(
    @Args('companyVacationId', { type: () => ID }) companyVacationId: string,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.assign(companyVacationId, employeeId, orgId);
  }

  @Mutation(() => Boolean)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  unassignCompanyVacationFromEmployee(
    @Args('companyVacationId', { type: () => ID }) companyVacationId: string,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.unassign(companyVacationId, employeeId, orgId);
  }
}
