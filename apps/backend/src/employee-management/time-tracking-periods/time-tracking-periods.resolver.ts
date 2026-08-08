import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { TimeTrackingPeriodsService } from './time-tracking-periods.service';
import {
  TimeTrackingPeriod,
  TimeTrackingPeriodStatus,
} from './entities/time-tracking-period.entity';

@Resolver(() => TimeTrackingPeriod)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TimeTrackingPeriodsResolver {
  constructor(private readonly service: TimeTrackingPeriodsService) {}

  @Query(() => [TimeTrackingPeriod], { name: 'timeTrackingPeriods' })
  @Permissions('TIMESHEET_READ')
  periods(@CurrentOrgId() orgId: string) {
    return this.service.findAll(orgId);
  }

  /** Current accounting-period anchor of the org, as MM-DD. */
  @Query(() => String, { name: 'timeTrackingPeriodAnchor' })
  @Permissions('TIMESHEET_READ')
  anchor(@CurrentOrgId() orgId: string) {
    return this.service.getAnchorValue(orgId);
  }

  @Mutation(() => String)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  setTimeTrackingPeriodAnchor(
    @CurrentOrgId() orgId: string,
    @Args('anchor', { type: () => String }) anchor: string,
  ) {
    return this.service.setAnchorValue(orgId, anchor);
  }

  @Mutation(() => TimeTrackingPeriod)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  setTimeTrackingPeriodStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => TimeTrackingPeriodStatus })
    status: TimeTrackingPeriodStatus,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.setStatus(id, orgId, status);
  }
}
