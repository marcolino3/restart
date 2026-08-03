import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { EmployeeFunctionsService } from './employee-functions.service';
import { EmployeeFunction } from './entities/employee-function.entity';
import { CreateEmployeeFunctionInput } from './dto/create-employee-function.input';
import { UpdateEmployeeFunctionInput } from './dto/update-employee-function.input';
import { ReorderEmployeeFunctionsInput } from './dto/reorder-employee-functions.input';

@Resolver(() => EmployeeFunction)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
@AdminPersonaOnly()
export class EmployeeFunctionsResolver {
  constructor(private readonly service: EmployeeFunctionsService) {}

  @Query(() => [EmployeeFunction], { name: 'employeeFunctionsByOrgId' })
  @Permissions('EMPLOYEE_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.service.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Query(() => EmployeeFunction, { name: 'employeeFunctionById' })
  @Permissions('EMPLOYEE_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findOne(id, orgId);
  }

  @Mutation(() => EmployeeFunction)
  @Permissions('EMPLOYEE_WRITE')
  createEmployeeFunction(
    @Args('input') input: CreateEmployeeFunctionInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.create(input, orgId);
  }

  @Mutation(() => EmployeeFunction)
  @Permissions('EMPLOYEE_WRITE')
  updateEmployeeFunction(
    @Args('input') input: UpdateEmployeeFunctionInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  archiveEmployeeFunction(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.archive(id, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteEmployeeFunction(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.remove(id, orgId);
  }

  @Mutation(() => [EmployeeFunction])
  @Permissions('EMPLOYEE_WRITE')
  reorderEmployeeFunctions(
    @Args('input') input: ReorderEmployeeFunctionsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.reorder(input.ids, orgId);
  }
}
