import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { RetentionPurgeService } from './retention-purge.service';
import { PurgeCandidate } from './entities/purge-candidate.entity';
import { PurgeStatus } from './enums/purge-status.enum';

@Resolver(() => PurgeCandidate)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class RetentionPurgeResolver {
  constructor(private readonly purgeService: RetentionPurgeService) {}

  @Query(() => [PurgeCandidate], { name: 'purgeCandidates' })
  @Permissions('RETENTION_MANAGE')
  candidates(
    @CurrentOrgId() orgId: string,
    @Args('status', { type: () => PurgeStatus, nullable: true })
    status?: PurgeStatus,
  ) {
    return this.purgeService.listCandidates(orgId, status);
  }

  /** Populates the review queue with records past their retention period. */
  @Mutation(() => Int)
  @Permissions('RETENTION_MANAGE')
  scanRetention(@CurrentOrgId() orgId: string) {
    return this.purgeService.scan(orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('RETENTION_MANAGE')
  reviewPurgeCandidate(
    @Args('id', { type: () => ID }) id: string,
    @Args('approve', { type: () => Boolean }) approve: boolean,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() reviewerId: string | null,
  ) {
    return this.purgeService.review(id, orgId, approve, reviewerId);
  }

  /** Executes an APPROVED candidate's DELETE/ANONYMIZE action. */
  @Mutation(() => Boolean)
  @Permissions('RETENTION_MANAGE')
  executePurgeCandidate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.purgeService.execute(id, orgId);
  }
}
