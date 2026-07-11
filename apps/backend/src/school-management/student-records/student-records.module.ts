import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { StudentRecordCategoriesResolver } from './student-record-categories.resolver';
import { StudentRecordCategoriesService } from './student-record-categories.service';
import { StudentRecordEntriesResolver } from './student-record-entries.resolver';
import { StudentRecordEntriesService } from './student-record-entries.service';
import { StudentRecordDocumentsController } from './student-record-documents.controller';
import { StudentRecordDocumentsResolver } from './student-record-documents.resolver';
import { StudentRecordDocumentsService } from './student-record-documents.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [StudentRecordDocumentsController],
  providers: [
    StudentRecordCategoriesResolver,
    StudentRecordCategoriesService,
    StudentRecordEntriesResolver,
    StudentRecordEntriesService,
    StudentRecordDocumentsResolver,
    StudentRecordDocumentsService,
  ],
  exports: [
    StudentRecordCategoriesService,
    StudentRecordEntriesService,
    StudentRecordDocumentsService,
  ],
})
export class StudentRecordsModule {}
