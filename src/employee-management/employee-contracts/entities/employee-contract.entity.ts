import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class EmployeeContract {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
