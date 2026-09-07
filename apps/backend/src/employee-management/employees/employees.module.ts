import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeeImportService } from './employee-import.service';
import { EmployeeInvitationService } from './employee-invitation.service';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesController } from './employees.controller';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/users/users.module';
import { EmployeeAuditLogModule } from '../employee-audit-log/employee-audit-log.module';
import { EmployeeContractsModule } from '../employee-contracts/employee-contracts.module';
import { EmployeeEmergencyModule } from '../employee-emergency/employee-emergency.module';
import { EmployeeHrProfilesModule } from '../employee-hr-profiles/employee-hr-profiles.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    UsersModule,
    EmployeeAuditLogModule,
    EmployeeContractsModule,
    EmployeeEmergencyModule,
    EmployeeHrProfilesModule,
    WorkTimeCalculationModule,
  ],
  controllers: [EmployeesController],
  providers: [
    EmployeesResolver,
    EmployeesService,
    EmployeeImportService,
    EmployeeInvitationService,
  ],
})
export class EmployeesModule {}
