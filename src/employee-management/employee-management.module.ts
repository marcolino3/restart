import { Module } from '@nestjs/common';
import { EmployeeContractsModule } from './employee-contracts/employee-contracts.module';
import { EmployeesModule } from './employees/employees.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [EmployeesModule, EmployeeContractsModule, TeamsModule],
})
export class EmployeeManagementModule {}
