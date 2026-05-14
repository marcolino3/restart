import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateTeamMemberInput } from './create-team-member.input';

@InputType()
export class UpdateTeamMemberInput extends PartialType(CreateTeamMemberInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
