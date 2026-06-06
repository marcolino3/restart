import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionRejectionReasonsResolver } from './admission-rejection-reasons.resolver';
import { AdmissionRejectionReasonsService } from './admission-rejection-reasons.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [
    AdmissionRejectionReasonsResolver,
    AdmissionRejectionReasonsService,
  ],
  exports: [AdmissionRejectionReasonsService],
})
export class AdmissionRejectionReasonsModule {}
