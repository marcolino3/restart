import { Module } from '@nestjs/common';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategoriesResolver } from './employee-absence-categories.resolver';

@Module({
  providers: [EmployeeAbsenceCategoriesResolver, EmployeeAbsenceCategoriesService],
})
export class EmployeeAbsenceCategoriesModule {}
