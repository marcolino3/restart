import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { VvtService } from './vvt.service';
import { ProcessingActivity } from './entities/processing-activity.entity';
import { Subprocessor } from './entities/subprocessor.entity';
import { CreateProcessingActivityInput } from './dto/create-processing-activity.input';
import { UpdateProcessingActivityInput } from './dto/update-processing-activity.input';
import { CreateSubprocessorInput } from './dto/create-subprocessor.input';
import { UpdateSubprocessorInput } from './dto/update-subprocessor.input';

@Resolver()
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class VvtResolver {
  constructor(private readonly vvtService: VvtService) {}

  // --- Processing activities ---

  @Query(() => [ProcessingActivity], { name: 'processingActivities' })
  @Permissions('VVT_READ')
  activities(@CurrentOrgId() orgId: string) {
    return this.vvtService.listActivities(orgId);
  }

  @Mutation(() => ProcessingActivity)
  @Permissions('VVT_MANAGE')
  createProcessingActivity(
    @Args('input') input: CreateProcessingActivityInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.vvtService.createActivity(input, orgId);
  }

  @Mutation(() => ProcessingActivity)
  @Permissions('VVT_MANAGE')
  updateProcessingActivity(
    @Args('input') input: UpdateProcessingActivityInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.vvtService.updateActivity(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('VVT_MANAGE')
  archiveProcessingActivity(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.vvtService.archiveActivity(id, orgId);
  }

  // --- Subprocessors ---

  @Query(() => [Subprocessor], { name: 'subprocessors' })
  @Permissions('VVT_READ')
  subprocessors(@CurrentOrgId() orgId: string) {
    return this.vvtService.listSubprocessors(orgId);
  }

  @Mutation(() => Subprocessor)
  @Permissions('VVT_MANAGE')
  createSubprocessor(
    @Args('input') input: CreateSubprocessorInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.vvtService.createSubprocessor(input, orgId);
  }

  @Mutation(() => Subprocessor)
  @Permissions('VVT_MANAGE')
  updateSubprocessor(
    @Args('input') input: UpdateSubprocessorInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.vvtService.updateSubprocessor(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('VVT_MANAGE')
  archiveSubprocessor(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.vvtService.archiveSubprocessor(id, orgId);
  }
}
