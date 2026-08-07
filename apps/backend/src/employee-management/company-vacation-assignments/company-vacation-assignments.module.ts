import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CompanyVacationAssignmentsService } from './company-vacation-assignments.service';
import { CompanyVacationAssignmentsResolver } from './company-vacation-assignments.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [
    CompanyVacationAssignmentsResolver,
    CompanyVacationAssignmentsService,
  ],
  exports: [CompanyVacationAssignmentsService],
})
export class CompanyVacationAssignmentsModule {}
