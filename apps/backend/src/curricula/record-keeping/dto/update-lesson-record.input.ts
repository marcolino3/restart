import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
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

@InputType()
export class UpdateLessonRecordInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  recordedAt?: string;

  @Field(() => LessonRecordStatus, { nullable: true })
  @IsOptional()
  @IsEnum(LessonRecordStatus)
  status?: LessonRecordStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  /** Worked-on time in minutes; explicit `null` clears it. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number | null;

  /**
   * Optionale Aktualisierung der Beobachtungs-Badges. Felder, die im Sub-Input
   * nicht gesetzt sind, bleiben unverändert; explizit `null` setzt zurück.
   */
  @Field(() => LessonRecordObservationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LessonRecordObservationInput)
  observation?: LessonRecordObservationInput | null;
}
