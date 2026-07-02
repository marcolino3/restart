import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { TimeTrackingPeriodsService } from './time-tracking-periods.service';
import { TimeTrackingPeriodsResolver } from './time-tracking-periods.resolver';
import { EmployeePeriodOpeningBalancesService } from './employee-period-opening-balances.service';
import { EmployeePeriodOpeningBalancesResolver } from './employee-period-opening-balances.resolver';

@Module({
  imports: [DatabaseModule, OrganizationSettingsModule],
  providers: [
    TimeTrackingPeriodsResolver,
    TimeTrackingPeriodsService,
    EmployeePeriodOpeningBalancesResolver,
    EmployeePeriodOpeningBalancesService,
  ],
  exports: [TimeTrackingPeriodsService, EmployeePeriodOpeningBalancesService],
})
export class TimeTrackingPeriodsModule {}
