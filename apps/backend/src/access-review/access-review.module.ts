import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AccessReviewResolver } from './access-review.resolver';
import { AccessReviewService } from './access-review.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [AccessReviewResolver, AccessReviewService],
  exports: [AccessReviewService],
})
export class AccessReviewModule {}
