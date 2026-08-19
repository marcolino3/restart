import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, type TransformFnParams } from 'class-transformer';
import { InputType, Field } from '@nestjs/graphql';
import {
  BillingInterval,
  CareModel,
  EducationLevel,
  ORGANIZATION_LOCALES,
  OrgLifecycleStatus,
  OrgPlan,
  SALUTATIONS,
  SchoolType,
  Sponsorship,
} from '@restart/shared-schemas/organizations/organization-enums';

// class-transformer types `TransformFnParams.value` as `any`; the inputs
// here are always plain form/GraphQL string values.
const EmptyToUndefined = () =>
  Transform(({ value }: TransformFnParams): unknown =>
    value === '' ? undefined : (value as unknown),
  );

/**
 * Every editable organization profile field, shared by the create and the
 * update input so both accept the exact same payload shape.
 */
@InputType()
export class OrganizationProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  subdomain?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  domain?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  zip?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  website?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  timezone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  shortCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(Sponsorship))
  @EmptyToUndefined()
  sponsorship?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(SchoolType))
  @EmptyToUndefined()
  schoolType?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(CareModel))
  @EmptyToUndefined()
  careModel?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  legalEntity?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(ORGANIZATION_LOCALES)
  @EmptyToUndefined()
  language?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  logoUrl?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  billingAddressSameAsLocation?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  billingAddressExtra?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(SALUTATIONS)
  @EmptyToUndefined()
  contactSalutation?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  contactTitle?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  contactFirstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  contactLastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  contactRole?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  contactEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  contactPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  billingEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  parentMailSenderEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  currentSchoolYear?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsIn(Object.values(EducationLevel), { each: true })
  activeLevels?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(OrgPlan))
  @EmptyToUndefined()
  plan?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  userLicenseLimit?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  contractEndsAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(BillingInterval))
  @EmptyToUndefined()
  billingInterval?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  billingAmountChf?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  storageLimitGb?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(OrgLifecycleStatus))
  @EmptyToUndefined()
  lifecycleStatus?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  @EmptyToUndefined()
  trialEndsAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  suspendedReason?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // --- Versicherungen ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  bvgProvider?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  bvgContactPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  uvgProvider?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  uvgContactPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  dailySicknessProvider?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  dailySicknessContactPhone?: string;
}
