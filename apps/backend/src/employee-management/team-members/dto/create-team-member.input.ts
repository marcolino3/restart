import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateTeamMemberInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
