import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';

/**
 * Bulk-edits every `LessonRecord` in one recording ACT (the group behind a
 * `RecentLessonRecordOutput` row) with a single shared status/duration —
 * mirrors how the bulk-entry form writes them in the first place.
 *
 * `studentIds`, when provided, is the full desired child set for the group:
 * students missing from the group are added (new records seeded with the
 * shared status/duration/note), students no longer in the list have their
 * record removed. Omit the field to leave the child set untouched.
 */
@InputType()
export class UpdateLessonRecordsGroupInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  recordIds: string[];

  @Field(() => ID)
  @IsUUID()
  lessonId: string;

  @Field(() => String)
  @IsString()
  recordedAt: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @Field(() => LessonRecordStatus, { nullable: true })
  @IsOptional()
  @IsEnum(LessonRecordStatus)
  status?: LessonRecordStatus;

  /** Worked-on time in minutes; explicit `null` clears it. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}
