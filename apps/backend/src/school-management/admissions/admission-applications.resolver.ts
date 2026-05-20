import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdmissionApplicationsService } from './admission-applications.service';
import { AdmissionAuditLogsService } from './admission-audit-logs.service';
import { CreateAdmissionApplicationInput } from './dto/create-admission-application.input';
import { FinalizeEnrollmentInput } from './dto/finalize-enrollment.input';
import { FinalizeEnrollmentOutput } from './dto/finalize-enrollment.output';
import { MoveAdmissionApplicationInput } from './dto/move-application.input';
import { RejectAdmissionApplicationInput } from './dto/reject-application.input';
import { ReorderAdmissionApplicationsInput } from './dto/reorder-applications.input';
import { UpdateAdmissionApplicationInput } from './dto/update-admission-application.input';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionAuditLog } from './entities/admission-audit-log.entity';

@Resolver(() => AdmissionApplication)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionApplicationsResolver {
  constructor(
    private readonly applications: AdmissionApplicationsService,
    private readonly auditLogs: AdmissionAuditLogsService,
  ) {}

  @Query(() => [AdmissionApplication], { name: 'admissionApplications' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('includeFinished', { type: () => Boolean, nullable: true })
    includeFinished?: boolean,
  ) {
    return this.applications.findAllByOrgId(orgId, includeFinished ?? false);
  }

  @Query(() => AdmissionApplication, { name: 'admissionApplicationById' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.applications.findOne(id, orgId);
  }

  @Query(() => [AdmissionApplication], {
    name: 'admissionApplicationsByFamily',
  })
  @Permissions('ADMISSION_APPLICATION_READ')
  findByFamily(
    @Args('familyId', { type: () => ID }) familyId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.applications.findByFamilyId(familyId, orgId);
  }

  @Query(() => [AdmissionAuditLog], { name: 'admissionAuditLogs' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findAuditLogs(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.auditLogs.findByApplication(applicationId, orgId);
  }

  @Mutation(() => AdmissionApplication)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  createAdmissionApplication(
    @Args('input') input: CreateAdmissionApplicationInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.create(input, orgId, actorMembershipId);
  }

  @Mutation(() => AdmissionApplication)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  updateAdmissionApplication(
    @Args('input') input: UpdateAdmissionApplicationInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.update(input, orgId, actorMembershipId);
  }

  @Mutation(() => AdmissionApplication)
  @Permissions('ADMISSION_APPLICATION_MOVE')
  moveAdmissionApplication(
    @Args('input') input: MoveAdmissionApplicationInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.move(input, orgId, actorMembershipId);
  }

  @Mutation(() => [AdmissionApplication])
  @Permissions('ADMISSION_APPLICATION_MOVE')
  reorderAdmissionApplications(
    @Args('input') input: ReorderAdmissionApplicationsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.applications.reorderInStage(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_APPLICATION_DELETE')
  archiveAdmissionApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.archive(id, orgId, actorMembershipId);
  }

  @Mutation(() => AdmissionApplication)
  @Permissions('ADMISSION_APPLICATION_WRITE')
  restoreAdmissionApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.restore(id, orgId, actorMembershipId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_APPLICATION_DELETE')
  deleteAdmissionApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.applications.hardDelete(id, orgId);
  }

  @Mutation(() => AdmissionApplication)
  @Permissions('ADMISSION_APPLICATION_DELETE')
  rejectAdmissionApplication(
    @Args('input') input: RejectAdmissionApplicationInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.reject(input, orgId, actorMembershipId);
  }

  @Mutation(() => FinalizeEnrollmentOutput)
  @Permissions('ADMISSION_APPLICATION_ENROLL')
  finalizeAdmissionEnrollment(
    @Args('input') input: FinalizeEnrollmentInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.applications.finalizeEnrollment(input, orgId, actorMembershipId);
  }
}
