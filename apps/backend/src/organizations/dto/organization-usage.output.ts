import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrganizationUsage {
  @Field(() => Int)
  userCount: number;

  @Field(() => Int)
  childCount: number;

  /**
   * Approximate storage usage. There is currently no per-file size tracking
   * (uploads store a URL/path only), so this is derived from
   * `storageLimitGb` context on the caller side / left at 0 until a real
   * storage-accounting mechanism exists. Kept as a field so the frontend
   * contract doesn't have to change once that lands.
   */
  @Field(() => Float)
  storageUsedGb: number;

  @Field(() => Int)
  activeUsersLast30Days: number;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date;

  @Field(() => Float)
  avgLoginsPerDay: number;
}
