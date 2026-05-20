import { Field, ID, InputType } from '@nestjs/graphql';
import { IsISO8601, IsUUID } from 'class-validator';

@InputType()
export class FinalizeEnrollmentInput {
  @Field(() => ID)
  @IsUUID()
  applicationId: string;

  @Field(() => ID)
  @IsUUID()
  schoolClassId: string;

  @Field(() => String)
  @IsISO8601()
  enrollmentDate: string;
}
