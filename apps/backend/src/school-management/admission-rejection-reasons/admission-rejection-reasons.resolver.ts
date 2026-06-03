import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { AdmissionRejectionReasonsService } from './admission-rejection-reasons.service';
import { AdmissionRejectionReason } from './entities/admission-rejection-reason.entity';
import { CreateAdmissionRejectionReasonInput } from './dto/create-admission-rejection-reason.input';
import { UpdateAdmissionRejectionReasonInput } from './dto/update-admission-rejection-reason.input';
import { ReorderAdmissionRejectionReasonsInput } from './dto/reorder-admission-rejection-reasons.input';

@Resolver(() => AdmissionRejectionReason)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionRejectionReasonsResolver {
  constructor(
    private readonly reasonsService: AdmissionRejectionReasonsService,
  ) {}

  @Query(() => [AdmissionRejectionReason], {
    name: 'admissionRejectionReasons',
  })
  @Permissions('ADMISSION_STAGE_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.reasonsService.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Mutation(() => AdmissionRejectionReason)
  @Permissions('ADMISSION_STAGE_MANAGE')
  createAdmissionRejectionReason(
    @Args('input') input: CreateAdmissionRejectionReasonInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reasonsService.create(input, orgId);
  }

  @Mutation(() => AdmissionRejectionReason)
  @Permissions('ADMISSION_STAGE_MANAGE')
  updateAdmissionRejectionReason(
    @Args('input') input: UpdateAdmissionRejectionReasonInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reasonsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_STAGE_MANAGE')
  archiveAdmissionRejectionReason(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reasonsService.archive(id, orgId);
  }

  @Mutation(() => [AdmissionRejectionReason])
  @Permissions('ADMISSION_STAGE_MANAGE')
  reorderAdmissionRejectionReasons(
    @Args('input') input: ReorderAdmissionRejectionReasonsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.reasonsService.reorder(input.ids, orgId);
  }
}
