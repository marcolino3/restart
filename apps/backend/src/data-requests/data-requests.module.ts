import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { DataSubjectRequestsResolver } from './data-subject-requests.resolver';
import { DataSubjectRequestsService } from './data-subject-requests.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [DataSubjectRequestsResolver, DataSubjectRequestsService],
  exports: [DataSubjectRequestsService],
})
export class DataRequestsModule {}
