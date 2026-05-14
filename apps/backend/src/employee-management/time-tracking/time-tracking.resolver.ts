import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTracking } from './entities/time-tracking.entity';
import { CreateTimeTrackingInput } from './dto/create-time-tracking.input';
import { UpdateTimeTrackingInput } from './dto/update-time-tracking.input';

@Resolver(() => TimeTracking)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class TimeTrackingResolver {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Query(() => [TimeTracking], { name: 'timeTrackingByEmployeeId' })
  @Permissions('TIMESHEET_READ')
  findAllByEmployee(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
    @Args('from', { type: () => String, nullable: true }) from?: string,
    @Args('to', { type: () => String, nullable: true }) to?: string,
  ) {
    return this.timeTrackingService.findAllByEmployeeId(
      employeeId,
      orgId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Query(() => TimeTracking, { name: 'timeTrackingById' })
  @Permissions('TIMESHEET_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.timeTrackingService.findOne(id, orgId);
  }

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  createTimeTracking(
    @Args('input') input: CreateTimeTrackingInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.timeTrackingService.create(input, orgId);
  }

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  startTimeTracking(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.timeTrackingService.start(employeeId, orgId);
  }

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  stopTimeTracking(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.timeTrackingService.stop(employeeId, orgId);
  }

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  updateTimeTracking(
    @Args('input') input: UpdateTimeTrackingInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.timeTrackingService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('TIMESHEET_WRITE')
  deleteTimeTracking(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.timeTrackingService.remove(id, orgId);
  }
}
