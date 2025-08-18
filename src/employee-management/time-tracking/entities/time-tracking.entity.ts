import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TimeTracking {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
