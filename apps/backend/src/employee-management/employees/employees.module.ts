import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeeInvitationService } from './employee-invitation.service';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesController } from './employees.controller';
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
  controllers: [EmployeesController],
  providers: [EmployeesResolver, EmployeesService, EmployeeInvitationService],
})
export class EmployeesModule {}
