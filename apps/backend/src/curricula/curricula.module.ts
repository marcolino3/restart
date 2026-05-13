import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { CurriculaResolver } from './curricula.resolver';
import { CurriculaService } from './curricula.service';
import { CurriculumLevelsResolver } from './curriculum-levels.resolver';
import { CurriculumLevelsService } from './curriculum-levels.service';
import { CurriculumNodesResolver } from './curriculum-nodes.resolver';
import { CurriculumNodesService } from './curriculum-nodes.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [
    CurriculumLevelsResolver,
    CurriculumLevelsService,
    CurriculaResolver,
    CurriculaService,
    CurriculumNodesResolver,
    CurriculumNodesService,
  ],
  exports: [CurriculumLevelsService, CurriculaService, CurriculumNodesService],
})
export class CurriculaModule {}
