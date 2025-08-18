import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateMembershipInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
