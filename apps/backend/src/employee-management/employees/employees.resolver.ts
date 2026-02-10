import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { CurrentMembership } from '@/auth/decorators/current-membership.decorator';
import { Membership } from '@/memberships/entities/membership.entity';
import { UpdateEmployeeInput } from './dto/update-employee.input';

@Resolver(() => Employee)
@UseGuards(GqlJwtAuthGuard)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Mutation(() => Employee, { name: 'createEmployee' })
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
  updateEmployee(
    @Args('updateEmployeeInput') updateEmployeeInput: UpdateEmployeeInput,
  ) {
    return this.employeesService.updateEmployeeMinimal(updateEmployeeInput);
  }

  @Query(() => [Employee], { name: 'employeesByOrgId' })
  async findEmployeesByOrgId(@CurrentMembership() membership: Membership) {
    const organizationId = membership.organizationId;
    return this.employeesService.findEmployeesByOrgId(organizationId);
  }

  @Query(() => Membership, { name: 'employeeById' })
  async findEmployeeById(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() organizationId: string,
  ) {
    return this.employeesService.findEmployeeById(employeeId, organizationId);
  }
}
