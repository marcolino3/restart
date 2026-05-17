import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import { LessonRecordObservationInput } from './lesson-record-observation.input';

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

  @Field(() => LessonRecordObservationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LessonRecordObservationInput)
  observation?: LessonRecordObservationInput | null;
}
