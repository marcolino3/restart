import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTracking } from './entities/time-tracking.entity';
import { CreateTimeTrackingInput } from './dto/create-time-tracking.input';
import { UpdateTimeTrackingInput } from './dto/update-time-tracking.input';

@Resolver(() => TimeTracking)
export class TimeTrackingResolver {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Mutation(() => TimeTracking)
  createTimeTracking(@Args('createTimeTrackingInput') createTimeTrackingInput: CreateTimeTrackingInput) {
    return this.timeTrackingService.create(createTimeTrackingInput);
  }

  @Query(() => [TimeTracking], { name: 'timeTracking' })
  findAll() {
    return this.timeTrackingService.findAll();
  }

  @Query(() => TimeTracking, { name: 'timeTracking' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.timeTrackingService.findOne(id);
  }

  @Mutation(() => TimeTracking)
  updateTimeTracking(@Args('updateTimeTrackingInput') updateTimeTrackingInput: UpdateTimeTrackingInput) {
    return this.timeTrackingService.update(updateTimeTrackingInput.id, updateTimeTrackingInput);
  }

  @Mutation(() => TimeTracking)
  removeTimeTracking(@Args('id', { type: () => Int }) id: number) {
    return this.timeTrackingService.remove(id);
  }
}
