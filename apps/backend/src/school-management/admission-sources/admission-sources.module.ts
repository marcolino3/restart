import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionSourcesResolver } from './admission-sources.resolver';
import { AdmissionSourcesService } from './admission-sources.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [AdmissionSourcesResolver, AdmissionSourcesService],
  exports: [AdmissionSourcesService],
})
export class AdmissionSourcesModule {}
