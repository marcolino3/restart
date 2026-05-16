import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateTeamInput } from './create-team.input';

@InputType()
export class UpdateTeamInput extends PartialType(CreateTeamInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
