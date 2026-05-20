import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategoriesResolver } from './employee-absence-categories.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [
    EmployeeAbsenceCategoriesResolver,
    EmployeeAbsenceCategoriesService,
  ],
  exports: [EmployeeAbsenceCategoriesService],
})
export class EmployeeAbsenceCategoriesModule {}
