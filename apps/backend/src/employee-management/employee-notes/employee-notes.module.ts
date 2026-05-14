import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { EmployeeNotesService } from './employee-notes.service';
import { EmployeeNotesResolver } from './employee-notes.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [EmployeeNotesResolver, EmployeeNotesService],
})
export class EmployeeNotesModule {}
