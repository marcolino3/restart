import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { EmployeeFunctionsResolver } from './employee-functions.resolver';
import { EmployeeFunctionsService } from './employee-functions.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [EmployeeFunctionsResolver, EmployeeFunctionsService],
  exports: [EmployeeFunctionsService],
})
export class EmployeeFunctionsModule {}
