import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EffectiveFieldPermissionOutput {
  @Field(() => String)
  resource: string;

  @Field(() => String)
  field: string;

  @Field(() => [String])
  actions: string[];
}
