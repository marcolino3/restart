import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { EmployeeEmergencyProfile } from './entities/employee-emergency-profile.entity';
import { EmployeeEmergencyService } from './employee-emergency.service';
import { UpsertEmployeeEmergencyProfileInput } from './dto/upsert-employee-emergency-profile.input';

@Resolver(() => EmployeeEmergencyProfile)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeEmergencyResolver {
  constructor(private readonly service: EmployeeEmergencyService) {}

  @Query(() => EmployeeEmergencyProfile, {
    name: 'employeeEmergencyProfile',
    nullable: true,
  })
  @Permissions('EMPLOYEE_READ')
  findByEmployeeId(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() organizationId: string,
  ) {
    return this.service.findByEmployeeId(employeeId, organizationId);
  }

  @Mutation(() => EmployeeEmergencyProfile, {
    name: 'upsertEmployeeEmergencyProfile',
  })
  @Permissions('EMPLOYEE_WRITE')
  upsert(
    @Args('input') input: UpsertEmployeeEmergencyProfileInput,
    @CurrentOrgId() organizationId: string,
    @CurrentUser() actor?: TokenPayload,
  ) {
    return this.service.upsert(
      input,
      organizationId,
      actor?.membershipId ?? null,
    );
  }
}
