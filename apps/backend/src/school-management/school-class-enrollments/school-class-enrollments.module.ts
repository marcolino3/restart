import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { StudentsModule } from '@/school-management/students/students.module';
import { SchoolClassEnrollmentsResolver } from './school-class-enrollments.resolver';
import { SchoolClassEnrollmentsService } from './school-class-enrollments.service';

@Module({
  imports: [CommonModule, DatabaseModule, StudentsModule],
  providers: [SchoolClassEnrollmentsResolver, SchoolClassEnrollmentsService],
  exports: [SchoolClassEnrollmentsService],
})
export class SchoolClassEnrollmentsModule {}
