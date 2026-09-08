import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

@InputType()
export class SetTeamShiftsInput {
  @Field(() => ID)
  @IsUUID()
  teamId!: string;

  /** Full replacement: the team works exactly these shifts afterwards. */
  @Field(() => [ID])
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  shiftIds!: string[];
}
