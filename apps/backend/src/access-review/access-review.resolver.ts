import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { AccessReviewService } from './access-review.service';
import { AccessReviewEntry } from './dto/access-review-entry.output';

@Resolver()
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AccessReviewResolver {
  constructor(private readonly accessReviewService: AccessReviewService) {}

  @Query(() => [AccessReviewEntry], { name: 'accessReview' })
  @Permissions('ROLE_ASSIGN')
  review(@CurrentOrgId() orgId: string) {
    return this.accessReviewService.getReview(orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('ROLE_ASSIGN')
  recertifyAccess(
    @Args('membershipId', { type: () => ID }) membershipId: string,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() reviewerId: string | null,
    @Args('note', { type: () => String, nullable: true }) note?: string,
  ) {
    return this.accessReviewService.recertify(
      membershipId,
      orgId,
      reviewerId,
      note,
    );
  }
}
