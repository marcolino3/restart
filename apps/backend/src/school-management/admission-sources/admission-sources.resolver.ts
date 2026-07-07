import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { AdmissionSourcesService } from './admission-sources.service';
import { AdmissionSource } from './entities/admission-source.entity';
import { CreateAdmissionSourceInput } from './dto/create-admission-source.input';
import { UpdateAdmissionSourceInput } from './dto/update-admission-source.input';
import { ReorderAdmissionSourcesInput } from './dto/reorder-admission-sources.input';

@Resolver(() => AdmissionSource)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionSourcesResolver {
  constructor(private readonly sourcesService: AdmissionSourcesService) {}

  @Query(() => [AdmissionSource], { name: 'admissionSources' })
  @Permissions('ADMISSION_STAGE_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.sourcesService.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Query(() => AdmissionSource, { name: 'admissionSourceById' })
  @Permissions('ADMISSION_STAGE_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.sourcesService.findOne(id, orgId);
  }

  @Mutation(() => AdmissionSource)
  @Permissions('ADMISSION_STAGE_MANAGE')
  createAdmissionSource(
    @Args('input') input: CreateAdmissionSourceInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.sourcesService.create(input, orgId);
  }

  @Mutation(() => AdmissionSource)
  @Permissions('ADMISSION_STAGE_MANAGE')
  updateAdmissionSource(
    @Args('input') input: UpdateAdmissionSourceInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.sourcesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_STAGE_MANAGE')
  archiveAdmissionSource(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.sourcesService.archive(id, orgId);
  }

  @Mutation(() => [AdmissionSource])
  @Permissions('ADMISSION_STAGE_MANAGE')
  reorderAdmissionSources(
    @Args('input') input: ReorderAdmissionSourcesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.sourcesService.reorder(input.ids, orgId);
  }
}
