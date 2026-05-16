import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  EmployeeContractType,
  EmployeePaymentInterval,
} from '../entities/employee-contract.entity';

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  probationEndDate?: string;

  @Field(() => EmployeeContractType, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeContractType)
  contractType?: EmployeeContractType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  position?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  supervisorMembershipId?: string | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  workloadPercent?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  weeklyHours?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossSalary?: number;

  @Field(() => EmployeePaymentInterval, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeePaymentInterval)
  paymentInterval?: EmployeePaymentInterval;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  has13thSalary?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
