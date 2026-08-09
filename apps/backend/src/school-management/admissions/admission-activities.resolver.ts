import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdmissionActivitiesService } from './admission-activities.service';
import { CreateAdmissionActivityInput } from './dto/create-admission-activity.input';
import { UpdateAdmissionActivityInput } from './dto/update-admission-activity.input';
import { AdmissionActivity } from './entities/admission-activity.entity';

@Resolver(() => AdmissionActivity)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionActivitiesResolver {
  constructor(private readonly activities: AdmissionActivitiesService) {}

  @Query(() => [AdmissionActivity], { name: 'admissionActivities' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findByApplication(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.activities.findByApplication(applicationId, orgId);
  }

  @Mutation(() => AdmissionActivity)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  createAdmissionActivity(
    @Args('input') input: CreateAdmissionActivityInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.activities.create(input, orgId, membershipId);
  }

  @Mutation(() => AdmissionActivity)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  updateAdmissionActivity(
    @Args('input') input: UpdateAdmissionActivityInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.activities.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  deleteAdmissionActivity(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.activities.remove(id, orgId);
  }
}
