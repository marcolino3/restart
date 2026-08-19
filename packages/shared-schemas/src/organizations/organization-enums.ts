// Plain varchar columns validated against these TS enums, not PG enum types
// — avoids ALTER TYPE ADD VALUE + same-migration usage (PG16 55P04), mirrors
// organization_feature_toggles.feature_key.

/**
 * How an organization is funded and governed — independent of its pedagogy.
 * Drives which accreditation/subsidy fields are relevant.
 */
export enum Sponsorship {
  OEFFENTLICH = 'OEFFENTLICH',
  PRIVAT_ANERKANNT = 'PRIVAT_ANERKANNT',
  PRIVAT_NICHT_ANERKANNT = 'PRIVAT_NICHT_ANERKANNT',
  KIRCHLICH = 'KIRCHLICH',
  GENOSSENSCHAFT_VEREIN = 'GENOSSENSCHAFT_VEREIN',
}

/**
 * The pedagogical concept a school follows. Formerly also carried care model
 * and education level, which now live in `CareModel` and `EducationLevel`.
 */
export enum SchoolType {
  MONTESSORI = 'MONTESSORI',
  WALDORF = 'WALDORF',
  FREIE_SCHULE = 'FREIE_SCHULE',
  REFORMPAEDAGOGIK = 'REFORMPAEDAGOGIK',
  REGELSCHULE = 'REGELSCHULE',
  SONSTIGE = 'SONSTIGE',
}

/** Age bands an organization covers — multiple values per organization. */
export enum EducationLevel {
  KINDERGARTEN_CASA = 'KINDERGARTEN_CASA',
  PRIMARSTUFE = 'PRIMARSTUFE',
  SEKUNDARSTUFE_I = 'SEKUNDARSTUFE_I',
  SEKUNDARSTUFE_II = 'SEKUNDARSTUFE_II',
}

/** How long children are looked after — drives care hours and absence logic. */
export enum CareModel {
  HALBTAGS = 'HALBTAGS',
  TAGESSCHULE = 'TAGESSCHULE',
  INTERNAT = 'INTERNAT',
}

/**
 * Locales an organization can be operated in. Plain codes rather than an enum:
 * the value stays a BCP 47 locale string usable by Intl APIs.
 */
export const ORGANIZATION_LOCALES = [
  'de-CH',
  'de-DE',
  'de-AT',
  'fr-CH',
  'it-CH',
  'en-GB',
] as const;

export type OrganizationLocale = (typeof ORGANIZATION_LOCALES)[number];

// The organization's contact person is addressed like any other contact
// person, so the salutation list is shared rather than duplicated.
export { SALUTATIONS } from '../contact-persons/contact-person-form.schema';

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
