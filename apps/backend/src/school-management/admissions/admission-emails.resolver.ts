import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdmissionEmailsService } from './admission-emails.service';
import { AdmissionEmailPreview } from './dto/admission-email-preview.output';
import { SendAdmissionEmailInput } from './dto/send-admission-email.input';
import { AdmissionEmail } from './entities/admission-email.entity';

@Resolver(() => AdmissionEmail)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AdmissionEmailsResolver {
  constructor(private readonly emails: AdmissionEmailsService) {}

  @Query(() => [AdmissionEmail], { name: 'admissionEmails' })
  @Permissions('ADMISSION_APPLICATION_READ')
  findByApplication(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.emails.findByApplication(applicationId, orgId);
  }

  @Query(() => AdmissionEmailPreview, { name: 'previewAdmissionEmail' })
  @Permissions('ADMISSION_EMAIL_SEND')
  preview(
    @Args('applicationId', { type: () => ID }) applicationId: string,
    @Args('templateId', { type: () => ID }) templateId: string,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.emails.preview(applicationId, templateId, orgId, membershipId);
  }

  @Mutation(() => AdmissionEmail)
  @Permissions('ADMISSION_EMAIL_SEND')
  sendAdmissionEmail(
    @Args('input') input: SendAdmissionEmailInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.emails.send(input, orgId, membershipId);
  }

  @Mutation(() => AdmissionEmail)
  @Permissions('ADMISSION_EMAIL_SEND')
  resendAdmissionEmail(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.emails.resend(id, orgId, membershipId);
  }

  @Mutation(() => Boolean)
  @Permissions('ADMISSION_EMAIL_SEND')
  deleteAdmissionEmail(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.emails.remove(id, orgId);
  }
}
