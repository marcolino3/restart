import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNumber, IsUUID } from 'class-validator';

@InputType()
export class UpsertEmployeePeriodOpeningBalanceInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => ID)
  @IsUUID()
  periodId: string;

  /** Carried-over work time in minutes (may be negative). */
  @Field(() => Int)
  @IsInt()
  openingWorkMinutes: number;

  /** Carried-over vacation days (decimal, half days allowed). */
  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  openingVacationDays: number;
}
