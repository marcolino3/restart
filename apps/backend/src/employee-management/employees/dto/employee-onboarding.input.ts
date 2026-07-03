import { Persona } from '@/common/enums/persona.enum';
import { EmployeeContractType } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
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

  @Field(() => WeekdayTimeWindowsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeekdayTimeWindowsInput)
  weekdayTimeWindows?: WeekdayTimeWindowsInput | null;

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

  // --- Step 1: Person ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => String)
  @IsString()
  firstName: string;

  @Field(() => String)
  @IsString()
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field(() => Persona, { nullable: true })
  @IsOptional()
  @IsEnum(Persona)
  persona?: Persona;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  privateEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  contactPhone2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
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
  language?: string;
}
