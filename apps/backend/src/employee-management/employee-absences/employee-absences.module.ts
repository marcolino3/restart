import { Module } from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { GoogleModule } from '@/google/google.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';

@Module({
  imports: [GoogleModule, WorkTimeCalculationModule, TimeTrackingPeriodsModule],
  providers: [EmployeeAbsencesResolver, EmployeeAbsencesService],
})
export class EmployeeAbsencesModule {}
