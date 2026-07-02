import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingResolver } from './time-tracking.resolver';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    WorkTimeCalculationModule,
    TimeTrackingPeriodsModule,
  ],
  providers: [TimeTrackingResolver, TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
