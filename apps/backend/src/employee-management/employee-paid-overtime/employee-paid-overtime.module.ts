import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { EmployeePaidOvertimeService } from './employee-paid-overtime.service';
import { EmployeePaidOvertimeResolver } from './employee-paid-overtime.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [EmployeePaidOvertimeResolver, EmployeePaidOvertimeService],
  exports: [EmployeePaidOvertimeService],
})
export class EmployeePaidOvertimeModule {}
