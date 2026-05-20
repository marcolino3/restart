import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { FamiliesResolver } from './families.resolver';
import { FamiliesService } from './families.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [FamiliesResolver, FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
