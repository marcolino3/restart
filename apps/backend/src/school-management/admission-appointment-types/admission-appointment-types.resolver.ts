import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { AdmissionAppointmentTypesService } from './admission-appointment-types.service';
import { AdmissionAppointmentType } from './entities/admission-appointment-type.entity';
import { CreateAdmissionAppointmentTypeInput } from './dto/create-admission-appointment-type.input';
import { UpdateAdmissionAppointmentTypeInput } from './dto/update-admission-appointment-type.input';
import { ReorderAdmissionAppointmentTypesInput } from './dto/reorder-admission-appointment-types.input';

@Resolver(() => AdmissionAppointmentType)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionAppointmentTypesResolver {
  constructor(
    private readonly typesService: AdmissionAppointmentTypesService,
  ) {}

  @Query(() => [AdmissionAppointmentType], {
    name: 'admissionAppointmentTypes',
  })
  @Permissions('ADMISSION_STAGE_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ) {
    return this.typesService.findAllByOrgId(orgId, includeArchived ?? false);
  }

  @Mutation(() => AdmissionAppointmentType)
  @Permissions('ADMISSION_STAGE_MANAGE')
  createAdmissionAppointmentType(
    @Args('input') input: CreateAdmissionAppointmentTypeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.typesService.create(input, orgId);
  }

  @Mutation(() => AdmissionAppointmentType)
  @Permissions('ADMISSION_STAGE_MANAGE')
  updateAdmissionAppointmentType(
    @Args('input') input: UpdateAdmissionAppointmentTypeInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.typesService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_STAGE_MANAGE')
  archiveAdmissionAppointmentType(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.typesService.archive(id, orgId);
  }

  @Mutation(() => [AdmissionAppointmentType])
  @Permissions('ADMISSION_STAGE_MANAGE')
  reorderAdmissionAppointmentTypes(
    @Args('input') input: ReorderAdmissionAppointmentTypesInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.typesService.reorder(input.ids, orgId);
  }
}
