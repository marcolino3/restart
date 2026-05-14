import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { AdmissionStagesModule } from '../admission-stages/admission-stages.module';
import { StudentsResolver } from './students.resolver';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';

@Module({
  imports: [CommonModule, DatabaseModule, AdmissionStagesModule],
  controllers: [StudentsController],
  providers: [StudentsResolver, StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
