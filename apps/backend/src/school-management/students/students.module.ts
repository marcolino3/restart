import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionStagesModule } from '../admission-stages/admission-stages.module';
import { StudentsResolver } from './students.resolver';
import { StudentsService } from './students.service';
import { StudentsImportController } from './import/students-import.controller';
import { StudentsImportResolver } from './import/students-import.resolver';
import { StudentsImportService } from './import/students-import.service';

@Module({
  imports: [CommonModule, DatabaseModule, AdmissionStagesModule],
  controllers: [StudentsImportController],
  providers: [
    StudentsResolver,
    StudentsService,
    StudentsImportResolver,
    StudentsImportService,
  ],
  exports: [StudentsService, StudentsImportService],
})
export class StudentsModule {}
