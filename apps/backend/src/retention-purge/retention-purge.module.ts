import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { RetentionPurgeResolver } from './retention-purge.resolver';
import { RetentionPurgeService } from './retention-purge.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [RetentionPurgeResolver, RetentionPurgeService],
  exports: [RetentionPurgeService],
})
export class RetentionPurgeModule {}
