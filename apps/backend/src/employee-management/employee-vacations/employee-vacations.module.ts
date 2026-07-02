import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';
import { EmployeeVacationsService } from './employee-vacations.service';
import { EmployeeVacationsResolver } from './employee-vacations.resolver';

@Module({
  imports: [
    DatabaseModule,
    WorkTimeCalculationModule,
    TimeTrackingPeriodsModule,
  ],
  providers: [EmployeeVacationsResolver, EmployeeVacationsService],
  exports: [EmployeeVacationsService],
})
export class EmployeeVacationsModule {}
