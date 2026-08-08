import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkTimeCalculationModule } from '@/employee-management/work-time-calculation/work-time-calculation.module';
import { TimeTrackingPeriodsModule } from '@/employee-management/time-tracking-periods/time-tracking-periods.module';
import { CompanyVacationAssignmentsService } from './company-vacation-assignments.service';
import { CompanyVacationAssignmentsResolver } from './company-vacation-assignments.resolver';

@Module({
  imports: [
    DatabaseModule,
    WorkTimeCalculationModule,
    TimeTrackingPeriodsModule,
  ],
  providers: [
    CompanyVacationAssignmentsResolver,
    CompanyVacationAssignmentsService,
  ],
  exports: [CompanyVacationAssignmentsService],
})
export class CompanyVacationAssignmentsModule {}
