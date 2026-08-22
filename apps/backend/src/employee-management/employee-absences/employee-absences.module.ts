import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { SmtpService } from '@/school-management/admissions/smtp.service';
import { GoogleModule } from '@/google/google.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { TimeTrackingPeriodsModule } from '../time-tracking-periods/time-tracking-periods.module';
import { AbsenceCertificatesController } from './absence-certificates.controller';
import { AbsenceCalendarSyncService } from './absence-calendar-sync.service';
import { AbsenceRecipientsService } from './absence-recipients.service';
import { AbsenceRequestNotificationService } from './absence-request-notification.service';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { EmployeeAbsencesService } from './employee-absences.service';

@Module({
  imports: [
    UsersModule,
    GoogleModule,
    WorkTimeCalculationModule,
    TimeTrackingPeriodsModule,
    OrganizationSettingsModule,
  ],
  controllers: [AbsenceCertificatesController],
  providers: [
    EmployeeAbsencesResolver,
    EmployeeAbsencesService,
    AbsenceCalendarSyncService,
    AbsenceRecipientsService,
    AbsenceRequestNotificationService,
    // Same reasoning as in SickLeaveModule: stateless transport, no coupling
    // to the admissions domain.
    SmtpService,
  ],
  exports: [AbsenceCalendarSyncService, AbsenceRecipientsService],
})
export class EmployeeAbsencesModule {}
