import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { RetentionPoliciesService } from './retention-policies.service';
import { RetentionPolicy } from './entities/retention-policy.entity';
import { UpsertRetentionPolicyInput } from './dto/upsert-retention-policy.input';

@Resolver(() => RetentionPolicy)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class RetentionPoliciesResolver {
  constructor(private readonly policiesService: RetentionPoliciesService) {}

  @Query(() => [RetentionPolicy], { name: 'retentionPolicies' })
  @Permissions('RETENTION_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.policiesService.findAllByOrgId(orgId);
  }

  @Mutation(() => RetentionPolicy)
  @Permissions('RETENTION_MANAGE')
  upsertRetentionPolicy(
    @Args('input') input: UpsertRetentionPolicyInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.policiesService.upsert(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('RETENTION_MANAGE')
  deleteRetentionPolicy(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.policiesService.delete(id, orgId);
  }

  /** Read-only preview of how many records currently exceed the period. */
  @ResolveField(() => Int, { nullable: true })
  dueCount(@Parent() policy: RetentionPolicy, @CurrentOrgId() orgId: string) {
    return this.policiesService.computeDueCount(
      policy.entityType,
      policy.retentionMonths,
      orgId,
    );
  }
}
