import { Module } from '@nestjs/common';
import { EmployeeContractsModule } from './employee-contracts/employee-contracts.module';
import { EmployeesModule } from './employees/employees.module';
import { EmployeeNotesModule } from './employee-notes/employee-notes.module';
import { EmployeeAuditLogModule } from './employee-audit-log/employee-audit-log.module';
import { EmployeeHrProfilesModule } from './employee-hr-profiles/employee-hr-profiles.module';
import { EmployeeEmergencyModule } from './employee-emergency/employee-emergency.module';
import { TeamsModule } from './teams/teams.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { TeamMembersModule } from './team-members/team-members.module';
import { EmployeeAbsenceCategoriesModule } from './employee-absence-categories/employee-absence-categories.module';
import { EmployeeAbsencesModule } from './employee-absences/employee-absences.module';
import { WorkTimeCalculationModule } from './work-time-calculation/work-time-calculation.module';

@Module({
  imports: [
    EmployeesModule,
    EmployeeContractsModule,
    EmployeeNotesModule,
    EmployeeAuditLogModule,
    EmployeeHrProfilesModule,
    EmployeeEmergencyModule,
    TeamsModule,
    TeamMembersModule,
    TimeTrackingModule,
    EmployeeAbsenceCategoriesModule,
    EmployeeAbsencesModule,
    WorkTimeCalculationModule,
  ],
})
export class EmployeeManagementModule {}
