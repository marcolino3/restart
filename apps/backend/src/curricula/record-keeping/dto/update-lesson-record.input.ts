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
}
