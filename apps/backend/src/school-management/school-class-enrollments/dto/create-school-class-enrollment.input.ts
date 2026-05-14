import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateSchoolClassEnrollmentInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  schoolClassId: string;

  @Field(() => String)
  @IsNotEmpty()
  enrolledAt: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  leftAt?: string;
}
