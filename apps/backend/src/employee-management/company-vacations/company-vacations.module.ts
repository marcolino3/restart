import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';
import { CompanyVacationsService } from './company-vacations.service';
import { CompanyVacationsResolver } from './company-vacations.resolver';

@Module({
  imports: [DatabaseModule, WorkTimeCalculationModule],
  providers: [CompanyVacationsResolver, CompanyVacationsService],
  exports: [CompanyVacationsService],
})
export class CompanyVacationsModule {}
