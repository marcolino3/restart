import { Module } from '@nestjs/common';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContractsResolver } from './employee-contracts.resolver';

@Module({
  providers: [EmployeeContractsResolver, EmployeeContractsService],
})
export class EmployeeContractsModule {}
