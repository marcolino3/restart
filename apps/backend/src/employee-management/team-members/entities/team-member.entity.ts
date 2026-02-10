import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TeamMember {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
