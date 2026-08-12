import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  BillingInterval,
  OrgPlan,
} from '@restart/shared-schemas/organizations/organization-enums';

@InputType()
export class ChangeOrganizationPlanInput {
  @Field(() => ID)
  @IsString()
  @IsUUID()
  id: string;

  @Field(() => String)
  @IsIn(Object.values(OrgPlan))
  plan: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  userLicenseLimit?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  contractEndsAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(BillingInterval))
  billingInterval?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  billingAmountChf?: number;
}
