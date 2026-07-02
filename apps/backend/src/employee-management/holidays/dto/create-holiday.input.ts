import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateHolidayInput {
  @Field(() => String)
  @IsDateString()
  date: string;

  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  paidPercentage?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  canton?: string;
}
