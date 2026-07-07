import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { Module } from '@nestjs/common';
import { AdmissionActivitiesResolver } from './admission-activities.resolver';
import { AdmissionActivitiesService } from './admission-activities.service';
import { AdmissionAppointmentsResolver } from './admission-appointments.resolver';
import { AdmissionAppointmentsService } from './admission-appointments.service';
import { AdmissionApplicationsResolver } from './admission-applications.resolver';
import { AdmissionApplicationsService } from './admission-applications.service';
import { AdmissionAuditLogsService } from './admission-audit-logs.service';
import { AdmissionEmailsResolver } from './admission-emails.resolver';
import { AdmissionEmailsService } from './admission-emails.service';
import { AdmissionReminderNotifierService } from './admission-reminder-notifier.service';
import { AdmissionRemindersResolver } from './admission-reminders.resolver';
import { AdmissionRemindersService } from './admission-reminders.service';
import { EmailTemplatesResolver } from './email-templates.resolver';
import { EmailTemplatesService } from './email-templates.service';
import { SmtpService } from './smtp.service';

@Module({
  imports: [CommonModule, DatabaseModule, OrganizationSettingsModule],
  providers: [
    AdmissionApplicationsResolver,
    AdmissionApplicationsService,
    AdmissionAuditLogsService,
    AdmissionActivitiesResolver,
    AdmissionActivitiesService,
    AdmissionRemindersResolver,
    AdmissionRemindersService,
    AdmissionReminderNotifierService,
    AdmissionAppointmentsResolver,
    AdmissionAppointmentsService,
    EmailTemplatesResolver,
    EmailTemplatesService,
    AdmissionEmailsResolver,
    AdmissionEmailsService,
    SmtpService,
  ],
  exports: [
    AdmissionApplicationsService,
    AdmissionAuditLogsService,
    AdmissionRemindersService,
    AdmissionAppointmentsService,
    EmailTemplatesService,
    AdmissionEmailsService,
  ],
})
export class AdmissionsModule {}
