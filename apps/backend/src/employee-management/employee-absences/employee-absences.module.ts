import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { GoogleModule } from '@/google/google.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';
import { AbsenceCertificatesController } from './absence-certificates.controller';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { EmployeeAbsencesService } from './employee-absences.service';

@Module({
  imports: [
    UsersModule,
    GoogleModule,
    WorkTimeCalculationModule,
    TimeTrackingPeriodsModule,
  ],
  controllers: [AbsenceCertificatesController],
  providers: [EmployeeAbsencesResolver, EmployeeAbsencesService],
})
export class EmployeeAbsencesModule {}
