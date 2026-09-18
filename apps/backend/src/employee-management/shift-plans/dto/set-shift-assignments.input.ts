import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, IsArray, IsUUID, Matches } from 'class-validator';
import { ISO_DATE } from './create-shift-plan.input';

/** Replaces the people of one plan cell (date x shift). */
@InputType()
export class SetShiftAssignmentsInput {
  @Field(() => ID)
  @IsUUID()
  planId!: string;

  @Field(() => String)
  @Matches(ISO_DATE)
  date!: string;

  @Field(() => ID)
  @IsUUID()
  shiftId!: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  employeeIds!: string[];
}
