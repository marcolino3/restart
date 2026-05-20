import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { AdmissionActivitiesResolver } from './admission-activities.resolver';
import { AdmissionActivitiesService } from './admission-activities.service';
import { AdmissionApplicationsResolver } from './admission-applications.resolver';
import { AdmissionApplicationsService } from './admission-applications.service';
import { AdmissionAuditLogsService } from './admission-audit-logs.service';
import { AdmissionRemindersResolver } from './admission-reminders.resolver';
import { AdmissionRemindersService } from './admission-reminders.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [
    AdmissionApplicationsResolver,
    AdmissionApplicationsService,
    AdmissionAuditLogsService,
    AdmissionActivitiesResolver,
    AdmissionActivitiesService,
    AdmissionRemindersResolver,
    AdmissionRemindersService,
  ],
  exports: [
    AdmissionApplicationsService,
    AdmissionAuditLogsService,
    AdmissionRemindersService,
  ],
})
export class AdmissionsModule {}
