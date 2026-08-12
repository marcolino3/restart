import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationFeatureTogglesResolver } from './organization-feature-toggles.resolver';
import { OrganizationFeatureTogglesService } from './organization-feature-toggles.service';
import { OrganizationAuditLogService } from './organization-audit-log.service';
import { SetupStatusResolver } from './setup-status.resolver';
import { SetupStatusService } from './setup-status.service';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { GoogleModule } from '@/google/google.module';

@Module({
  imports: [CommonModule, DatabaseModule, GoogleModule],
  providers: [
    OrganizationsResolver,
    OrganizationsService,
    OrganizationFeatureTogglesResolver,
    OrganizationFeatureTogglesService,
    OrganizationAuditLogService,
    SetupStatusResolver,
    SetupStatusService,
  ],
  exports: [
    OrganizationsService,
    OrganizationFeatureTogglesService,
    OrganizationAuditLogService,
  ],
})
export class OrganizationsModule {}
