import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

@InputType()
export class LessonRecordsFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  schoolClassId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  recordedFrom?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  recordedTo?: string;

  @Field(() => [LessonRecordStatus], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(LessonRecordStatus, { each: true })
  statuses?: LessonRecordStatus[];
}
