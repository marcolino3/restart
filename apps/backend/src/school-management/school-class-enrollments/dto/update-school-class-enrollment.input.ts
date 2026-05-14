import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsUUID } from 'class-validator';

@InputType()
export class UpdateSchoolClassEnrollmentInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  leftAt?: string;
}
