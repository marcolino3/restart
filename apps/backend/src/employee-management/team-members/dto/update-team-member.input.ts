import { CreateTeamMemberInput } from './create-team-member.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateTeamMemberInput extends PartialType(CreateTeamMemberInput) {
  @Field(() => Int)
  id: number;
}
