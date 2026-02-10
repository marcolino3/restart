import { Module } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingResolver } from './time-tracking.resolver';

@Module({
  providers: [TimeTrackingResolver, TimeTrackingService],
})
export class TimeTrackingModule {}
