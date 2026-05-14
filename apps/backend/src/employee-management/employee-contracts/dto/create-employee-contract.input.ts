import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateEmployeeContractInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => String)
  @IsDateString()
  startDate: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  workloadPercent?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossSalary?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
