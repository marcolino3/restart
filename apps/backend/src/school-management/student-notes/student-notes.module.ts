import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { StudentNotesService } from './student-notes.service';
import { StudentNotesResolver } from './student-notes.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [StudentNotesResolver, StudentNotesService],
})
export class StudentNotesModule {}
