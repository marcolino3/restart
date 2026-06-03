import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionBoardSettingsResolver } from './admission-board-settings.resolver';
import { AdmissionBoardSettingsService } from './admission-board-settings.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [AdmissionBoardSettingsResolver, AdmissionBoardSettingsService],
  exports: [AdmissionBoardSettingsService],
})
export class AdmissionBoardSettingsModule {}
