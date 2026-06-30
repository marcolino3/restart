import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingResolver } from './time-tracking.resolver';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';

@Module({
  imports: [CommonModule, DatabaseModule, WorkTimeCalculationModule],
  providers: [TimeTrackingResolver, TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
