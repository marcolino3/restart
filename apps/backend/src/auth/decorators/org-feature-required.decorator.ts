import { SetMetadata } from '@nestjs/common';
import type { OrgFeatureKey } from '@restart/shared-schemas/org-features/feature-catalog';

// Marks a resolver class or method as gated behind an org-level feature
// toggle, checked by OrgFeatureGuard against OrganizationFeatureToggle rows
// for the request's active org.
export const ORG_FEATURE_REQUIRED_KEY = 'orgFeatureRequired';

export const OrgFeatureRequired = (featureKey: OrgFeatureKey) =>
  SetMetadata(ORG_FEATURE_REQUIRED_KEY, featureKey);
