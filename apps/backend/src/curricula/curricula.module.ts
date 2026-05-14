import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/users/users.module';
import { CurriculaResolver } from './curricula.resolver';
import { CurriculaService } from './curricula.service';
import { CurriculumLevelsResolver } from './curriculum-levels.resolver';
import { CurriculumLevelsService } from './curriculum-levels.service';
import { CurriculumNodesResolver } from './curriculum-nodes.resolver';
import { CurriculumNodesService } from './curriculum-nodes.service';
import { CurriculaImportController } from './import/curricula-import.controller';
import { CurriculaImportResolver } from './import/curricula-import.resolver';
import { CurriculaImportService } from './import/curricula-import.service';

@Module({
  imports: [CommonModule, DatabaseModule, UsersModule],
  controllers: [CurriculaImportController],
  providers: [
    CurriculumLevelsResolver,
    CurriculumLevelsService,
    CurriculaResolver,
    CurriculaService,
    CurriculumNodesResolver,
    CurriculumNodesService,
    CurriculaImportService,
    CurriculaImportResolver,
  ],
  exports: [
    CurriculumLevelsService,
    CurriculaService,
    CurriculumNodesService,
    CurriculaImportService,
  ],
})
export class CurriculaModule {}
