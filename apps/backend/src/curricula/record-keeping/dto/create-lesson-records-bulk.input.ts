import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import { LessonRecordObservationInput } from './lesson-record-observation.input';

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

  /** Worked-on time in minutes, seeded onto every child of the bulk.
   *  Capped at a school day (600) — anything larger is a typo. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number | null;

  /**
   * Seed-Werte für die Beobachtungs-Badges. Gelten für alle Kinder im Bulk;
   * individuelle Anpassungen erfolgen nach dem Save per Update-Mutation
   * (Akkordeon-UI im Bulk-Modal).
   */
  @Field(() => LessonRecordObservationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LessonRecordObservationInput)
  observation?: LessonRecordObservationInput | null;
}
