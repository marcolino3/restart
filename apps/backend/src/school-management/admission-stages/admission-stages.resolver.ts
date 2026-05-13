import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { AdmissionStagesService } from './admission-stages.service';
import { AdmissionStage } from './entities/admission-stage.entity';
import { CreateAdmissionStageInput } from './dto/create-admission-stage.input';
import { UpdateAdmissionStageInput } from './dto/update-admission-stage.input';
import { ReorderAdmissionStagesInput } from './dto/reorder-admission-stages.input';

@Resolver(() => AdmissionStage)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionStagesResolver {
  constructor(private readonly stagesService: AdmissionStagesService) {}

  @Query(() => [AdmissionStage], { name: 'admissionStages' })
  @Permissions('ADMISSION_STAGE_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.stagesService.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Query(() => AdmissionStage, { name: 'admissionStageById' })
  @Permissions('ADMISSION_STAGE_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.stagesService.findOne(id, orgId);
  }

  @Mutation(() => AdmissionStage)
  @Permissions('ADMISSION_STAGE_MANAGE')
  createAdmissionStage(
    @Args('input') input: CreateAdmissionStageInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.stagesService.create(input, orgId);
  }

  @Mutation(() => AdmissionStage)
  @Permissions('ADMISSION_STAGE_MANAGE')
  updateAdmissionStage(
    @Args('input') input: UpdateAdmissionStageInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.stagesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_STAGE_MANAGE')
  archiveAdmissionStage(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.stagesService.archive(id, orgId);
  }

  @Mutation(() => [AdmissionStage])
  @Permissions('ADMISSION_STAGE_MANAGE')
  reorderAdmissionStages(
    @Args('input') input: ReorderAdmissionStagesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.stagesService.reorder(input.ids, orgId);
  }
}
