import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AuthAccount {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
