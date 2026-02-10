import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTracking } from './entities/time-tracking.entity';
import { CreateTimeTrackingInput } from './dto/create-time-tracking.input';
import { UpdateTimeTrackingInput } from './dto/update-time-tracking.input';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';

@Resolver(() => TimeTracking)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class TimeTrackingResolver {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  createTimeTracking(
    @Args('createTimeTrackingInput')
    createTimeTrackingInput: CreateTimeTrackingInput,
  ) {
    return this.timeTrackingService.create(createTimeTrackingInput);
  }

  @Query(() => [TimeTracking], { name: 'timeTracking' })
  @Permissions('TIMESHEET_READ')
  findAll() {
    return this.timeTrackingService.findAll();
  }

  @Query(() => TimeTracking, { name: 'timeTracking' })
  @Permissions('TIMESHEET_READ')
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.timeTrackingService.findOne(id);
  }

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  updateTimeTracking(
    @Args('updateTimeTrackingInput')
    updateTimeTrackingInput: UpdateTimeTrackingInput,
  ) {
    return this.timeTrackingService.update(
      updateTimeTrackingInput.id,
      updateTimeTrackingInput,
    );
  }

  @Mutation(() => TimeTracking)
  @Permissions('TIMESHEET_WRITE')
  removeTimeTracking(@Args('id', { type: () => Int }) id: number) {
    return this.timeTrackingService.remove(id);
  }
}
