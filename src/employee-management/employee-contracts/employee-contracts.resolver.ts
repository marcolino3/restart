import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContract } from './entities/employee-contract.entity';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';

@Resolver(() => EmployeeContract)
export class EmployeeContractsResolver {
  constructor(private readonly employeeContractsService: EmployeeContractsService) {}

  @Mutation(() => EmployeeContract)
  createEmployeeContract(@Args('createEmployeeContractInput') createEmployeeContractInput: CreateEmployeeContractInput) {
    return this.employeeContractsService.create(createEmployeeContractInput);
  }

  @Query(() => [EmployeeContract], { name: 'employeeContracts' })
  findAll() {
    return this.employeeContractsService.findAll();
  }

  @Query(() => EmployeeContract, { name: 'employeeContract' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.employeeContractsService.findOne(id);
  }

  @Mutation(() => EmployeeContract)
  updateEmployeeContract(@Args('updateEmployeeContractInput') updateEmployeeContractInput: UpdateEmployeeContractInput) {
    return this.employeeContractsService.update(updateEmployeeContractInput.id, updateEmployeeContractInput);
  }

  @Mutation(() => EmployeeContract)
  removeEmployeeContract(@Args('id', { type: () => Int }) id: number) {
    return this.employeeContractsService.remove(id);
  }
}
