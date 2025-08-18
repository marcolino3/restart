import { Module } from '@nestjs/common';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { GoogleModule } from '@/google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [EmployeeAbsencesResolver, EmployeeAbsencesService],
})
export class EmployeeAbsencesModule {}
