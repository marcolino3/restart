import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationSetting } from './entities/organization-setting.entity';
import { OrganizationSettingsService } from './organization-settings.service';
import { OrganizationSettingsResolver } from './organization-settings.resolver';
import { EncryptionService } from './encryption.service';

import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([OrganizationSetting])],
  providers: [
    OrganizationSettingsResolver,
    OrganizationSettingsService,
    EncryptionService,
  ],
  exports: [OrganizationSettingsService, EncryptionService],
})
export class OrganizationSettingsModule {}
