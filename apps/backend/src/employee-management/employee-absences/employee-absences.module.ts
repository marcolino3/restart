import { Module } from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { GoogleModule } from '@/google/google.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';

@Module({
  imports: [GoogleModule, WorkTimeCalculationModule],
  providers: [EmployeeAbsencesResolver, EmployeeAbsencesService],
})
export class EmployeeAbsencesModule {}
