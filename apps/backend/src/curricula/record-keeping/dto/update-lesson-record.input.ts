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
