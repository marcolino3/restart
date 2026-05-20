import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { UpdateEmployeeInput } from './dto/update-employee.input';

@Resolver(() => Employee)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

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
