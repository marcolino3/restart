import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { WEEKDAY_KEYS } from '@/employee-management/employee-contracts/contract-shifts';

@InputType()
export class ShiftCoverageRowInput {
  @Field(() => ID)
  @IsUUID()
  shiftId!: string;

  @Field(() => String)
  @IsIn(WEEKDAY_KEYS as readonly string[])
  weekday!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(999)
  requiredCount!: number;
}

@InputType()
export class SetShiftCoverageInput {
  @Field(() => ID)
  @IsUUID()
  teamId!: string;

  /** Full replacement: rows not listed (or with count 0) are removed. */
  @Field(() => [ShiftCoverageRowInput])
  @IsArray()
  @ArrayMaxSize(700)
  @ValidateNested({ each: true })
  @Type(() => ShiftCoverageRowInput)
  rows!: ShiftCoverageRowInput[];
}
