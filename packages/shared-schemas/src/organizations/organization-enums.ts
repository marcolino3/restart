// Plain varchar columns validated against these TS enums, not PG enum types
// — avoids ALTER TYPE ADD VALUE + same-migration usage (PG16 55P04), mirrors
// organization_feature_toggles.feature_key.

export enum SchoolType {
  MONTESSORI = 'MONTESSORI',
  FREIE_SCHULE = 'FREIE_SCHULE',
  TAGESSCHULE = 'TAGESSCHULE',
  KINDERGARTEN_CASA = 'KINDERGARTEN_CASA',
}

export enum OrgPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum OrgLifecycleStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
}

export enum OrganizationAuditAction {
  FEATURE_TOGGLED = 'FEATURE_TOGGLED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  SUSPENDED = 'SUSPENDED',
  REACTIVATED = 'REACTIVATED',
  IMPERSONATION_STARTED = 'IMPERSONATION_STARTED',
  IMPERSONATION_STOPPED = 'IMPERSONATION_STOPPED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
}
