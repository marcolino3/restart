import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { EmployeeHrProfilesService } from './employee-hr-profiles.service';
import { EmployeeHrProfilesResolver } from './employee-hr-profiles.resolver';
import { EmployeeAuditLogModule } from '../employee-audit-log/employee-audit-log.module';

@Module({
  imports: [DatabaseModule, EmployeeAuditLogModule],
  providers: [EmployeeHrProfilesResolver, EmployeeHrProfilesService],
})
export class EmployeeHrProfilesModule {}
