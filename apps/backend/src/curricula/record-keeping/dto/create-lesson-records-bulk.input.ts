import { Field, ID, InputType } from '@nestjs/graphql';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

/**
 * Lesson-First Bulk-Eingabe:
 * Eine Lektion → mehrere Kinder gleichzeitig → ein Status.
 */
@InputType()
export class CreateLessonRecordsBulkInput {
  @Field(() => ID)
  @IsUUID()
  lessonId: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  studentIds: string[];

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
}
