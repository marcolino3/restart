import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

import { EmployeeAuditLog } from './entities/employee-audit-log.entity';
import { EmployeeAuditLogService } from './employee-audit-log.service';

@Resolver(() => EmployeeAuditLog)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeAuditLogResolver {
  constructor(private readonly service: EmployeeAuditLogService) {}

  @Query(() => [EmployeeAuditLog], { name: 'employeeAuditLog' })
  @Permissions('EMPLOYEE_READ')
  findByEmployeeId(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() organizationId: string,
  ) {
    return this.service.findByEmployeeId(employeeId, organizationId);
  }
}
