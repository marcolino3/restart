import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { EmployeeAuditLogService } from './employee-audit-log.service';
import { EmployeeAuditLogResolver } from './employee-audit-log.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [EmployeeAuditLogResolver, EmployeeAuditLogService],
  exports: [EmployeeAuditLogService],
})
export class EmployeeAuditLogModule {}
