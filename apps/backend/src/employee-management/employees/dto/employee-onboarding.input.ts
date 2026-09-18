import {
  IsEmail,
  MaxLength,
  Matches as MatchesBasis,
  IsDateString as IsBasisDate,
} from 'class-validator';
import { Persona } from '@/common/enums/persona.enum';
import {
  EmployeeContractType,
  EmployeePaymentInterval,
} from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

@InputType()
export class TimeWindowInput {
  @Field(() => String)
  @Matches(HHMM, { message: 'start must be HH:mm' })
  start: string;

  @Field(() => String)
  @Matches(HHMM, { message: 'end must be HH:mm' })
  end: string;
}

@InputType()
export class WeekdayTimeWindowsInput {
  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  mon?: TimeWindowInput[] | null;

  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  tue?: TimeWindowInput[] | null;

  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  wed?: TimeWindowInput[] | null;

  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  thu?: TimeWindowInput[] | null;

  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  fri?: TimeWindowInput[] | null;

  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  sat?: TimeWindowInput[] | null;

  @Field(() => [TimeWindowInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowInput)
  sun?: TimeWindowInput[] | null;
}

@InputType()
export class WeekdayWorkloadsInput {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mon?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tue?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  wed?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  thu?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fri?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sat?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sun?: number | null;
}

/** Contract fields captured by the onboarding wizard (all optional for drafts). */
@InputType()
export class OnboardingContractInput {
  @Field(() => EmployeeContractType, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeeContractType)
  contractType?: EmployeeContractType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  position?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  probationEndDate?: string;

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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualVacationDays?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grossSalary?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @Field(() => EmployeePaymentInterval, { nullable: true })
  @IsOptional()
  @IsEnum(EmployeePaymentInterval)
  paymentInterval?: EmployeePaymentInterval;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  has13thSalary?: boolean;

  @Field(() => WeekdayTimeWindowsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeekdayTimeWindowsInput)
  weekdayTimeWindows?: WeekdayTimeWindowsInput | null;

  @Field(() => WeekdayWorkloadsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeekdayWorkloadsInput)
  weekdayWorkloads?: WeekdayWorkloadsInput | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

/**
 * Single input for the onboarding wizard's auto-saving draft. When `id` is
 * omitted a new DRAFT employee is created; otherwise the existing draft is
 * patched. Only person basics are required to create; everything else is
 * filled in progressively across the three wizard steps.
 */
@InputType()
export class EmployeeOnboardingInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;

  // --- Step 1: Person ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  title?: string;

  @Field(() => String)
  @IsString()
  @MaxLength(120)
  @MatchesBasis(/\S/, { message: 'Name must not be blank' })
  firstName: string;

  @Field(() => String)
  @IsString()
  @MaxLength(120)
  @MatchesBasis(/\S/, { message: 'Name must not be blank' })
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  @IsEmail()
  email?: string;

  @Field(() => Persona, { nullable: true })
  @IsOptional()
  @IsEnum(Persona)
  persona?: Persona;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MatchesBasis(/^\d{4}-\d{2}-\d{2}$/)
  @IsBasisDate({ strict: true })
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  @IsEmail()
  privateEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  // --- Step 2: Vertrag & Pensum ---
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  timeTrackingEnabled?: boolean;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @Field(() => TeamMemberRole, { nullable: true })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  teamRole?: TeamMemberRole;

  @Field(() => OnboardingContractInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingContractInput)
  contract?: OnboardingContractInput | null;

  // --- Step 3: Rollen & Zugang ---
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
