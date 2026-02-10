import { Module } from '@nestjs/common';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContractsResolver } from './employee-contracts.resolver';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [EmployeeContractsResolver, EmployeeContractsService],
})
export class EmployeeContractsModule {}
