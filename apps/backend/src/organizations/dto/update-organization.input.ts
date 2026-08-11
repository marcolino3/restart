import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform, type TransformFnParams } from 'class-transformer';
import { CreateOrganizationInput } from './create-organization.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IOrganization } from '../interfaces/organization.interface';
import {
  BillingInterval,
  OrgLifecycleStatus,
  OrgPlan,
  SchoolType,
} from '@restart/shared-schemas/organizations/organization-enums';

// class-transformer types `TransformFnParams.value` as `any`; the inputs
// here are always plain form/GraphQL string values.
const EmptyToUndefined = () =>
  Transform(({ value }: TransformFnParams): unknown =>
    value === '' ? undefined : (value as unknown),
  );

@InputType()
export class UpdateOrganizationInput
  extends PartialType(CreateOrganizationInput)
  implements Partial<IOrganization>
{
  @Field(() => ID)
  @IsString()
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: false })
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
  @IsIn(Object.values(SchoolType))
  @EmptyToUndefined()
  schoolType?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  legalEntity?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  language?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  logoUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  state?: string;

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
  @IsString()
  @EmptyToUndefined()
  contactName?: string;

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

  @Field(() => [ID], { nullable: true })
  teamIds?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

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
