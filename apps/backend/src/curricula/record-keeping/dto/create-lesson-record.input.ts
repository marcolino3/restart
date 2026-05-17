import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

@InputType()
export class CreateLessonRecordInput {
  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field(() => ID)
  @IsUUID()
  lessonId: string;

  @Field(() => String)
  @IsISO8601({ strict: true })
  recordedAt: string;

  @Field(() => LessonRecordStatus)
  @IsEnum(LessonRecordStatus)
  status: LessonRecordStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  schoolClassEnrollmentId?: string | null;
}
