import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { OrganizationSettingsModule } from '@/organization-settings/organization-settings.module';
import { ContractAiService } from './contract-ai.service';
import { ContractTemplatesResolver } from './contract-templates.resolver';
import { ContractTemplatesService } from './contract-templates.service';

@Module({
  imports: [CommonModule, DatabaseModule, OrganizationSettingsModule],
  providers: [
    ContractTemplatesResolver,
    ContractTemplatesService,
    ContractAiService,
  ],
  exports: [ContractTemplatesService],
})
export class ContractTemplatesModule {}
