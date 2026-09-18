import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeeInvitationService } from './employee-invitation.service';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesController } from './employees.controller';
import { EmployeeAccountController } from './employee-account.controller';
import { EmployeeStorageCleanupService } from './employee-storage-cleanup.service';
import { AccountEmailController } from './account-email.controller';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/users/users.module';
import { EmployeeAuditLogModule } from '../employee-audit-log/employee-audit-log.module';
import { WorkTimeCalculationModule } from '../work-time-calculation/work-time-calculation.module';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    UsersModule,
    EmployeeAuditLogModule,
    WorkTimeCalculationModule,
  ],
  controllers: [
    EmployeesController,
    EmployeeAccountController,
    AccountEmailController,
  ],
  providers: [
    EmployeesResolver,
    EmployeesService,
    EmployeeInvitationService,
    EmployeeStorageCleanupService,
  ],
})
export class EmployeesModule {}
