import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContract } from './entities/employee-contract.entity';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';

@Resolver(() => EmployeeContract)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
@AdminPersonaOnly()
export class EmployeeContractsResolver {
  constructor(
    private readonly employeeContractsService: EmployeeContractsService,
  ) {}

  @Query(() => [EmployeeContract], { name: 'employeeContractsByOrgId' })
  @Permissions('EMPLOYEE_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.employeeContractsService.findAllByOrgId(orgId);
  }

  @Query(() => [EmployeeContract], { name: 'employeeContractsByEmployeeId' })
  @Permissions('EMPLOYEE_READ')
  findAllByEmployee(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.findAllByEmployeeId(employeeId, orgId);
  }

  @Query(() => EmployeeContract, { name: 'employeeContractById' })
  @Permissions('EMPLOYEE_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.findOne(id, orgId);
  }

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  createEmployeeContract(
    @Args('input') input: CreateEmployeeContractInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.create(input, orgId);
  }

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  updateEmployeeContract(
    @Args('input') input: UpdateEmployeeContractInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteEmployeeContract(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.remove(id, orgId);
  }
}
