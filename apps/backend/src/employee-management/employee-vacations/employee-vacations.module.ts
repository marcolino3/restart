import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { EmployeeVacationsService } from './employee-vacations.service';
import { EmployeeVacationsResolver } from './employee-vacations.resolver';

@Module({
  imports: [DatabaseModule, WorkTimeCalculationModule],
  providers: [EmployeeVacationsResolver, EmployeeVacationsService],
  exports: [EmployeeVacationsService],
})
export class EmployeeVacationsModule {}
