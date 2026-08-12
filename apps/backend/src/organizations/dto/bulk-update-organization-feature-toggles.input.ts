import { Field, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { ORG_FEATURE_KEYS } from '@restart/shared-schemas/org-features/feature-catalog';

@InputType()
export class FeatureToggleUpdateInput {
  @Field(() => String)
  @IsString()
  @IsIn(ORG_FEATURE_KEYS)
  featureKey: string;

  @Field(() => Boolean)
  @IsBoolean()
  enabled: boolean;
}

@InputType()
export class BulkUpdateOrganizationFeatureTogglesInput {
  @Field(() => ID)
  @IsString()
  @IsUUID()
  organizationId: string;

  @Field(() => [FeatureToggleUpdateInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeatureToggleUpdateInput)
  updates: FeatureToggleUpdateInput[];
}
