import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { CompanyVacationsModule } from '../company-vacations/company-vacations.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';
import { HolidaysService } from './holidays.service';
import { HolidaysResolver } from './holidays.resolver';

@Module({
  imports: [
    DatabaseModule,
    WorkTimeCalculationModule,
    CompanyVacationsModule,
    TimeTrackingPeriodsModule,
  ],
  providers: [HolidaysResolver, HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
