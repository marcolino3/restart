import { ObjectType, Field } from '@nestjs/graphql';
import { Persona } from '@/common/enums/persona.enum';
import { User } from '../entities/user.entity';

@ObjectType()
export class AuthContextOutput {
  @Field(() => User)
  user: User;

  @Field(() => [String])
  roles: string[];

  @Field(() => [String])
  permissions: string[];

  @Field(() => String, { nullable: true })
  orgId?: string;

  @Field(() => Persona, { nullable: true })
  persona?: Persona;

  @Field(() => Boolean)
  isSuperAdmin: boolean;
}
