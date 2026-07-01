import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { TimeTrackingPeriodsService } from './time-tracking-periods.service';
import { TimeTrackingPeriodsResolver } from './time-tracking-periods.resolver';

@Module({
  imports: [DatabaseModule, OrganizationSettingsModule],
  providers: [TimeTrackingPeriodsResolver, TimeTrackingPeriodsService],
  exports: [TimeTrackingPeriodsService],
})
export class TimeTrackingPeriodsModule {}
