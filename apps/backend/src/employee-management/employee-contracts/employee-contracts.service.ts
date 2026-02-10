import { Injectable } from '@nestjs/common';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';

@Injectable()
export class EmployeeContractsService {
  create(createEmployeeContractInput: CreateEmployeeContractInput) {
    return 'This action adds a new employeeContract';
  }

  findAll() {
    return `This action returns all employeeContracts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employeeContract`;
  }

  update(id: number, updateEmployeeContractInput: UpdateEmployeeContractInput) {
    return `This action updates a #${id} employeeContract`;
  }

  remove(id: number) {
    return `This action removes a #${id} employeeContract`;
  }
}
