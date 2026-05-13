import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreateTeamMemberInput {
  @Field(() => ID)
  @IsUUID()
  teamId: string;

  @Field(() => ID)
  @IsUUID()
  employeeId: string;
}
