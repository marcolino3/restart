import z from "zod";

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
} from "./organization-enums";

export const OrganizationFormSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, { message: "Darf nicht leer sein" })
    .optional()
    .default(""),
  subdomain: z
    .string()
    .min(1, { message: "Darf nicht leer sein" })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt. Keine Leerzeichen oder Sonderzeichen.",
    })
    .optional()
    .default(""),
  domain: z.string().optional().default(""),
  street: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.email().optional().or(z.literal("")).default(""),
  website: z.string().optional().default(""),
  timezone: z.string().optional().default("Europe/Berlin"),
  isActive: z.boolean().default(false),
  shortCode: z.string().max(8).optional().default(""),
  sponsorship: z.enum(Sponsorship).optional(),
  schoolType: z.enum(SchoolType).optional(),
  careModel: z.enum(CareModel).optional(),
  legalEntity: z.string().optional().default(""),
  language: z.enum(ORGANIZATION_LOCALES).optional().default("de-CH"),
  logoUrl: z.string().optional().default(""),
  billingAddressSameAsLocation: z.boolean().default(true),
  billingAddressExtra: z.string().optional().default(""),
  contactSalutation: z.enum(SALUTATIONS).optional(),
  contactTitle: z.string().optional().default(""),
  contactFirstName: z.string().optional().default(""),
  contactLastName: z.string().optional().default(""),
  contactRole: z.string().optional().default(""),
  contactEmail: z.email().optional().or(z.literal("")).default(""),
  contactPhone: z.string().optional().default(""),
  billingEmail: z.email().optional().or(z.literal("")).default(""),
  parentMailSenderEmail: z.email().optional().or(z.literal("")).default(""),
  currentSchoolYear: z.string().optional().default(""),
  activeLevels: z.array(z.enum(EducationLevel)).optional().default([]),
  plan: z.enum(OrgPlan).optional().default(OrgPlan.STARTER),
  userLicenseLimit: z.number().int().optional(),
  contractEndsAt: z.string().optional().default(""),
  billingInterval: z
    .enum(BillingInterval)
    .optional()
    .default(BillingInterval.YEARLY),
  billingAmountChf: z.number().optional(),
  storageLimitGb: z.number().int().optional(),
  lifecycleStatus: z
    .enum(OrgLifecycleStatus)
    .optional()
    .default(OrgLifecycleStatus.ACTIVE),
  trialEndsAt: z.string().optional().default(""),
  suspendedReason: z.string().optional().default(""),
  bvgProvider: z.string().optional().default(""),
  bvgContactPhone: z.string().optional().default(""),
  uvgProvider: z.string().optional().default(""),
  uvgContactPhone: z.string().optional().default(""),
  dailySicknessProvider: z.string().optional().default(""),
  dailySicknessContactPhone: z.string().optional().default(""),
});

/**
 * Create mode: the name is mandatory.
 *
 * Every field in `OrganizationFormSchema` is `.optional().default("")` so the
 * edit form can be fed a partially filled organization — which also means the
 * `.min(1)` on `name` never fires there. An organization created without a
 * name is invisible in every list and org switcher, so the create form
 * validates against this variant instead.
 */
export const CreateOrganizationFormSchema = OrganizationFormSchema.extend({
  name: z.string().trim().min(1, { message: "Darf nicht leer sein" }),
});

export type OrganizationFormInput = z.input<typeof OrganizationFormSchema>;
export type OrganizationFormOutput = z.output<typeof OrganizationFormSchema>;
