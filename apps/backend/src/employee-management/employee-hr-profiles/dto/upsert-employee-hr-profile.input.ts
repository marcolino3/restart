import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  EmployeeMaritalStatus,
  EmployeeOnboardingStatus,
  EmployeeResidencePermitType,
} from '../entities/employee-hr-profile.entity';

@InputType()
export class UpsertEmployeeHrProfileInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  // --- Bankverbindung ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  iban?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bankAccountHolder?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bankName?: string;

  // --- Versicherungen & Steuern ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bvgProvider?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bvgInsuranceNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  uvgProvider?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  withholdingTaxCode?: string;

  // --- Stammdaten ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  nationality?: string;

  @Field(() => EmployeeResidencePermitType, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeResidencePermitType)
  residencePermitType?: EmployeeResidencePermitType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  residencePermitValidUntil?: string;

  @Field(() => EmployeeMaritalStatus, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeMaritalStatus)
  maritalStatus?: EmployeeMaritalStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  denomination?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfChildren?: number;

  // --- Onboarding / Compliance ---
  @Field(() => EmployeeOnboardingStatus, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeOnboardingStatus)
  onboardingStatus?: EmployeeOnboardingStatus;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  ndaSigned?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  criminalRecordSubmitted?: boolean;
}
