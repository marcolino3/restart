import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionStagesResolver } from './admission-stages.resolver';
import { AdmissionStagesService } from './admission-stages.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [AdmissionStagesResolver, AdmissionStagesService],
  exports: [AdmissionStagesService],
})
export class AdmissionStagesModule {}
