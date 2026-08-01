import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/users/users.module';
import { StudentsModule } from '@/school-management/students/students.module';
import { GradeLevelsModule } from '@/school-management/grade-levels/grade-levels.module';
import { CurriculaResolver } from './curricula.resolver';
import { CurriculaService } from './curricula.service';
import { CurriculumLevelsResolver } from './curriculum-levels.resolver';
import { CurriculumLevelsService } from './curriculum-levels.service';
import { CurriculumNodesResolver } from './curriculum-nodes.resolver';
import { CurriculumNodesService } from './curriculum-nodes.service';
import { CurriculaImportController } from './import/curricula-import.controller';
import { CurriculaImportResolver } from './import/curricula-import.resolver';
import { CurriculaImportService } from './import/curricula-import.service';
import { LessonRecordAttachmentsController } from './record-keeping/lesson-record-attachments.controller';
import { LessonRecordAttachmentsService } from './record-keeping/lesson-record-attachments.service';
import { LessonRecordsResolver } from './record-keeping/lesson-records.resolver';
import { LessonRecordsService } from './record-keeping/lesson-records.service';
import { RecordKeepingSettingsResolver } from './record-keeping/record-keeping-settings.resolver';
import { RecordKeepingSettingsService } from './record-keeping/record-keeping-settings.service';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    UsersModule,
    StudentsModule,
    GradeLevelsModule,
  ],
  controllers: [CurriculaImportController, LessonRecordAttachmentsController],
  providers: [
    CurriculumLevelsResolver,
    CurriculumLevelsService,
    CurriculaResolver,
    CurriculaService,
    CurriculumNodesResolver,
    CurriculumNodesService,
    CurriculaImportService,
    CurriculaImportResolver,
    LessonRecordsResolver,
    LessonRecordsService,
    LessonRecordAttachmentsService,
    RecordKeepingSettingsResolver,
    RecordKeepingSettingsService,
  ],
  exports: [
    CurriculumLevelsService,
    CurriculaService,
    CurriculumNodesService,
    CurriculaImportService,
    LessonRecordsService,
    LessonRecordAttachmentsService,
    RecordKeepingSettingsService,
  ],
})
export class CurriculaModule {}
