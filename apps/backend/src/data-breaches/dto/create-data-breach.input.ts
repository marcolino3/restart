import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DataBreachRiskLevel } from '../enums/data-breach-risk-level.enum';

@InputType()
export class CreateDataBreachInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  detectedAt?: Date;

  @Field(() => DataBreachRiskLevel, { nullable: true })
  @IsOptional()
  @IsEnum(DataBreachRiskLevel)
  riskLevel?: DataBreachRiskLevel;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  affectedScope?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  affectedCount?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
