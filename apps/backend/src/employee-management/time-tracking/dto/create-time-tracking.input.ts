import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateTimeTrackingInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
