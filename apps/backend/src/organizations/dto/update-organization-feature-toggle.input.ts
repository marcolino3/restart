import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsIn, IsUUID } from 'class-validator';

import { ORG_FEATURE_KEYS } from '@restart/shared-schemas/org-features/feature-catalog';

@InputType()
export class UpdateOrganizationFeatureToggleInput {
  @Field(() => ID)
  @IsUUID()
  organizationId!: string;

  @Field()
  @IsIn(ORG_FEATURE_KEYS)
  featureKey!: string;

  @Field()
  @IsBoolean()
  enabled!: boolean;
}
