import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { GradeLevelsResolver } from './grade-levels.resolver';
import { GradeLevelsService } from './grade-levels.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [GradeLevelsResolver, GradeLevelsService],
  exports: [GradeLevelsService],
})
export class GradeLevelsModule {}
