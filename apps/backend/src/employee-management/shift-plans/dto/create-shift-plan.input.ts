import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID, Matches } from 'class-validator';

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@InputType()
export class CreateShiftPlanInput {
  @Field(() => ID)
  @IsUUID()
  teamId!: string;

  @Field(() => String)
  @Matches(ISO_DATE)
  startDate!: string;

  @Field(() => String)
  @Matches(ISO_DATE)
  endDate!: string;
}
