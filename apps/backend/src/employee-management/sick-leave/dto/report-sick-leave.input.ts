import { Field, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

@InputType()
export class ReportSickLeaveInput {
  /** Day the employee reports sick for, `YYYY-MM-DD`. */
  @Field(() => String)
  @IsDateString()
  date: string;

  /**
   * Optional `HH:mm` the sickness starts at on `date`. Omitted means the whole
   * day; the calendar event stays all-day either way.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be HH:mm',
  })
  startTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
