import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { EmployeeHrProfile } from './entities/employee-hr-profile.entity';
import { EmployeeHrProfilesService } from './employee-hr-profiles.service';
import { UpsertEmployeeHrProfileInput } from './dto/upsert-employee-hr-profile.input';

@Resolver(() => EmployeeHrProfile)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeHrProfilesResolver {
  constructor(private readonly service: EmployeeHrProfilesService) {}

  @Query(() => EmployeeHrProfile, {
    name: 'employeeHrProfile',
    nullable: true,
  })
  @Permissions('EMPLOYEE_READ')
  findByEmployeeId(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() organizationId: string,
  ) {
    return this.service.findByEmployeeId(employeeId, organizationId);
  }

  @Mutation(() => EmployeeHrProfile, { name: 'upsertEmployeeHrProfile' })
  @Permissions('EMPLOYEE_WRITE')
  upsert(
    @Args('input') input: UpsertEmployeeHrProfileInput,
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
