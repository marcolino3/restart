import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { ConsentsService } from './consents.service';
import { Consent } from './entities/consent.entity';
import { ConsentAuditLog } from './entities/consent-audit-log.entity';
import { RecordConsentInput } from './dto/record-consent.input';
import { WithdrawConsentInput } from './dto/withdraw-consent.input';
import { ConsentSubjectType } from './enums/consent-subject-type.enum';

@Resolver(() => Consent)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ConsentsResolver {
  constructor(private readonly consentsService: ConsentsService) {}

  @Query(() => [Consent], { name: 'consentsForSubject' })
  @Permissions('CONSENT_READ')
  findForSubject(
    @Args('subjectType', { type: () => ConsentSubjectType })
    subjectType: ConsentSubjectType,
    @Args('subjectId', { type: () => ID }) subjectId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.consentsService.findForSubject(subjectType, subjectId, orgId);
  }

  @Query(() => [ConsentAuditLog], { name: 'consentAuditTrail' })
  @Permissions('CONSENT_READ')
  findAuditTrail(
    @Args('subjectType', { type: () => ConsentSubjectType })
    subjectType: ConsentSubjectType,
    @Args('subjectId', { type: () => ID }) subjectId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.consentsService.findAuditTrail(subjectType, subjectId, orgId);
  }

  @Mutation(() => Consent)
  @Permissions('CONSENT_MANAGE')
  recordConsent(
    @Args('input') input: RecordConsentInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.consentsService.record(input, orgId, actorMembershipId);
  }

  @Mutation(() => Consent)
  @Permissions('CONSENT_MANAGE')
  withdrawConsent(
    @Args('input') input: WithdrawConsentInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() actorMembershipId: string | null,
  ) {
    return this.consentsService.withdraw(input, orgId, actorMembershipId);
  }
}
