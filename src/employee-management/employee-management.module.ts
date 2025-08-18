import { Module } from '@nestjs/common';
import { EmployeeContractsModule } from './employee-contracts/employee-contracts.module';
import { EmployeesModule } from './employees/employees.module';
import { TeamsModule } from './teams/teams.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { TeamMembersModule } from './team-members/team-members.module';
import { EmployeeAbsenceCategoriesModule } from './employee-absence-categories/employee-absence-categories.module';
import { EmployeeAbsencesModule } from './employee-absences/employee-absences.module';

@Module({
  imports: [
    EmployeesModule,
    EmployeeContractsModule,
    TeamsModule,
    TeamMembersModule,
    TimeTrackingModule,
    EmployeeAbsenceCategoriesModule,
    EmployeeAbsencesModule,
  ],
})
export class EmployeeManagementModule {}
