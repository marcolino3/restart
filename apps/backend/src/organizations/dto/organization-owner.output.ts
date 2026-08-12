import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrganizationOwner {
  @Field(() => ID)
  userId: string;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => String)
  email: string;
}
