import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ShiftBreakInput } from './shift-break.input';

export const TIME_HH_MM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

@InputType()
export class CreateShiftInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Field(() => String)
  @Matches(TIME_HH_MM_RE, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @Field(() => String)
  @Matches(TIME_HH_MM_RE, { message: 'endTime must be HH:MM' })
  endTime!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(HEX_COLOR_RE, { message: 'color must be #RRGGBB' })
  color?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /** Unpaid breaks; must lie inside the shift and not overlap. */
  @Field(() => [ShiftBreakInput], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ShiftBreakInput)
  breaks?: ShiftBreakInput[];
}
