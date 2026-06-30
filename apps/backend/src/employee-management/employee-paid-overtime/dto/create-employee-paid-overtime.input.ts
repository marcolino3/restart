import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@InputType()
export class CreateEmployeePaidOvertimeInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => String)
  @IsDateString()
  date: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  minutes: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
