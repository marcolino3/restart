import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateStudentRecordEntryInput {
  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  /** ISO-8601 timestamp — converted to Date in the service. */
  @Field(() => String)
  @IsISO8601()
  occurredAt: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isConfidential?: boolean;
}
