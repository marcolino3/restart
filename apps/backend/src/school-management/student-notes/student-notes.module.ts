import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { StudentsModule } from '@/school-management/students/students.module';
import { StudentNotesService } from './student-notes.service';
import { StudentNotesResolver } from './student-notes.resolver';

@Module({
  imports: [DatabaseModule, StudentsModule],
  providers: [StudentNotesResolver, StudentNotesService],
})
export class StudentNotesModule {}
