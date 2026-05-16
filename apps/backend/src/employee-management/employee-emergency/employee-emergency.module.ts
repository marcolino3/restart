import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { EmployeeEmergencyService } from './employee-emergency.service';
import { EmployeeEmergencyResolver } from './employee-emergency.resolver';
import { EmployeeAuditLogModule } from '../employee-audit-log/employee-audit-log.module';

@Module({
  imports: [DatabaseModule, EmployeeAuditLogModule],
  providers: [EmployeeEmergencyResolver, EmployeeEmergencyService],
})
export class EmployeeEmergencyModule {}
