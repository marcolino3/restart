import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { RetentionPoliciesResolver } from './retention-policies.resolver';
import { RetentionPoliciesService } from './retention-policies.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [RetentionPoliciesResolver, RetentionPoliciesService],
  exports: [RetentionPoliciesService],
})
export class RetentionModule {}
