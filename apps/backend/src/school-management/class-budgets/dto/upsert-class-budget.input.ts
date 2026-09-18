import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MAX_AMOUNT = 9_999_999_999.99;

@InputType()
export class UpsertClassBudgetInput {
  @Field(() => ID)
  @IsUUID()
  schoolClassId: string;

  /** Calendar year the school year starts in — 2026 for "2026/27". */
  @Field(() => Int)
  @IsInt()
  @Min(2000)
  @Max(2100)
  schoolYearStart: number;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_AMOUNT)
  amount: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
