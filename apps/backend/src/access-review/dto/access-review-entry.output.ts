import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * A member who holds at least one sensitive permission, with the data needed to
 * review (recertify) their access. Computed live from RBAC — not persisted.
 */
@ObjectType()
export class AccessReviewEntry {
  @Field(() => ID)
  membershipId: string;

  @Field(() => String)
  memberName: string;

  @Field(() => [String])
  roles: string[];

  @Field(() => [String])
  sensitivePermissions: string[];

  @Field(() => Date, { nullable: true })
  lastReviewedAt?: Date | null;
}
