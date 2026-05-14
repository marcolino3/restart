import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingResolver } from './time-tracking.resolver';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [TimeTrackingResolver, TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
