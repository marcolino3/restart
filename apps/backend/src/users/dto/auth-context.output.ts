import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@ObjectType()
export class AuthContextOutput {
  @Field(() => User)
  user: User;

  @Field(() => [String])
  roles: string[];

  @Field(() => [String])
  permissions: string[];

  @Field(() => String)
  orgId: string;

  @Field(() => Boolean)
  isSuperAdmin: boolean;
}
