import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContract } from './entities/employee-contract.entity';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';

@Resolver(() => EmployeeContract)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class EmployeeContractsResolver {
  constructor(private readonly employeeContractsService: EmployeeContractsService) {}

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  createEmployeeContract(@Args('createEmployeeContractInput') createEmployeeContractInput: CreateEmployeeContractInput) {
    return this.employeeContractsService.create(createEmployeeContractInput);
  }

  @Query(() => [EmployeeContract], { name: 'employeeContracts' })
  @Permissions('EMPLOYEE_READ')
  findAll() {
    return this.employeeContractsService.findAll();
  }

  @Query(() => EmployeeContract, { name: 'employeeContract' })
  @Permissions('EMPLOYEE_READ')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.employeeContractsService.findOne(id);
  }

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  updateEmployeeContract(@Args('updateEmployeeContractInput') updateEmployeeContractInput: UpdateEmployeeContractInput) {
    return this.employeeContractsService.update(updateEmployeeContractInput.id, updateEmployeeContractInput);
  }

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  removeEmployeeContract(@Args('id', { type: () => Int }) id: number) {
    return this.employeeContractsService.remove(id);
  }
}
