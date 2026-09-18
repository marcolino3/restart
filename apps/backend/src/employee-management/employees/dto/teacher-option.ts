import { Field, ID, ObjectType } from '@nestjs/graphql';

/** Public directory projection. Never expose Employee/Membership/User traversal here. */
@ObjectType()
export class TeacherOption {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  firstName!: string;

  @Field(() => String)
  lastName!: string;

  @Field(() => ID, { nullable: true })
  userId!: string | null;
}
