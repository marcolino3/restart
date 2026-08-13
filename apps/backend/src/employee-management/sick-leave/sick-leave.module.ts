import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { SmtpService } from '@/school-management/admissions/smtp.service';
import { Module } from '@nestjs/common';
import { EmployeeAbsencesModule } from '../employee-absences/employee-absences.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';
import { SickLeaveNotificationService } from './sick-leave-notification.service';
import { SickLeaveResolver } from './sick-leave.resolver';
import { SickLeaveService } from './sick-leave.service';

@Module({
  imports: [
    EmployeeAbsencesModule,
    TimeTrackingPeriodsModule,
    OrganizationSettingsModule,
  ],
  providers: [
    SickLeaveResolver,
    SickLeaveService,
    SickLeaveNotificationService,
    // Provided directly instead of importing AdmissionsModule: SmtpService is a
    // stateless transport with no admissions-specific dependencies, and pulling
    // the whole school-management module into HR wiring would couple two
    // unrelated domains.
    SmtpService,
  ],
  exports: [SickLeaveService],
})
export class SickLeaveModule {}
