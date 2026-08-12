import { Field, Int, ObjectType } from '@nestjs/graphql';

import { Organization } from '@/organizations/entities/organization.entity';

@ObjectType()
export class OrganizationOverviewRow {
  @Field(() => Organization)
  organization: Organization;

  @Field(() => Int)
  memberCount: number;

  @Field(() => Int)
  childCount: number;

  @Field(() => Int)
  enabledFeatureCount: number;

  /**
   * Days remaining until `trialEndsAt`, only meaningful while
   * lifecycleStatus === TRIAL. Null once there is no trial end date.
   */
  @Field(() => Int, { nullable: true })
  trialDaysRemaining?: number;
}

@ObjectType()
export class OrganizationsOverviewStats {
  @Field(() => Int)
  activeCount: number;

  @Field(() => Int)
  trialCount: number;

  @Field(() => Int)
  totalUserCount: number;

  @Field(() => Int)
  suspendedCount: number;
}

@ObjectType()
export class OrganizationsOverview {
  @Field(() => OrganizationsOverviewStats)
  stats: OrganizationsOverviewStats;

  @Field(() => [OrganizationOverviewRow])
  rows: OrganizationOverviewRow[];
}
