import { z } from "zod";
import { Persona } from "@restart/shared-types/graphql";
import {
  EmployeeContractTypeEnum,
  EmployeePaymentIntervalEnum,
} from "./employee-contract-form.schema";
import {
  WeekdayTimeWindowsSchema,
  WeekdayWorkloadsSchema,
} from "./weekday-schedule.schema";
import { refineEndDateNotBeforeStart } from "./contract-date-rules";

// Re-export schedule primitives so existing `@restart/shared-schemas/employees/
// employee-onboarding-form.schema` imports keep working.
export {
  TimeWindowSchema,
  WEEKDAY_KEYS,
  WeekdayTimeWindowsSchema,
  WeekdayWorkloadsSchema,
  type TimeWindow,
  type WeekdayKey,
  type WeekdayTimeWindows,
  type WeekdayWorkloads,
} from "./weekday-schedule.schema";

export const InvitationTimingEnum = z.enum([
  "IMMEDIATE",
  "ON_ENTRY_DATE",
  "MANUAL",
]);

/** Workload in percent — fractions are intentional (e.g. 53.2 % from a plan). */
const percentOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).max(100).nullable(),
  )
  .optional();

const intOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable(),
  )
  .optional();

const numericOrNull = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().nullable(),
  )
  .optional();

/**
 * Single schema backing the 3-step onboarding wizard (one react-hook-form
 * across all steps). Only firstName/lastName are strictly required so the draft
 * can auto-save early; contract completeness and roles are enforced by the
 * backend on finalize (finalizeEmployeeOnboarding).
 */
export const EmployeeOnboardingFormSchema = z.object({
  id: z.string().uuid().optional(),

  // --- Step 1: Person ---
  title: z.string().optional().default(""),
  firstName: z.string().min(1, { message: "Vorname ist erforderlich" }),
  lastName: z.string().min(1, { message: "Nachname ist erforderlich" }),
  email: z
    .string()
    .email({ message: "Ungültige E-Mail-Adresse" })
    .optional(),
  persona: z.nativeEnum(Persona).default(Persona.Employee),
  dateOfBirth: z.date().nullable().optional(),
  socialSecurityNumber: z.string().optional().default(""),
  privateEmail: z.union([z.string().email(), z.literal("")]).optional(),
  contactPhone: z.string().optional().default(""),
  contactPhone2: z.string().optional().default(""),
  street: z.string().optional().default(""),
  houseNumber: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  avatarUrl: z.string().optional().default(""),

  // --- Step 2: Vertrag & Pensum ---
  timeTrackingEnabled: z.boolean().default(true),
  contractType: EmployeeContractTypeEnum.or(z.literal("")).optional(),
  position: z.string().optional().default(""),
  startDate: z.preprocess((v) => {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return v;
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? v : d;
    }
    return v;
  }, z.date().nullable()).optional(),
  endDate: z.preprocess((v) => {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return v;
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? v : d;
    }
    return v;
  }, z.date().nullable()).optional(),
  probationEndDate: z.preprocess((v) => {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return v;
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? v : d;
    }
    return v;
  }, z.date().nullable()).optional(),
  workloadPercent: percentOrNull,
  weeklyHours: z.string().optional().default(""),
  annualVacationDays: intOrNull,
  // Salary stays optional here: the wizard auto-saves drafts, so the
  // contract-type rules are only enforced on finalize (backend).
  grossSalary: numericOrNull,
  hourlyRate: numericOrNull,
  paymentInterval: EmployeePaymentIntervalEnum.or(z.literal("")).optional(),
  has13thSalary: z.boolean().nullable().optional(),
  weekdayTimeWindows: WeekdayTimeWindowsSchema.optional(),
  weekdayWorkloads: WeekdayWorkloadsSchema.optional(),
  documentUrl: z.string().optional().default(""),
  teamId: z.string().uuid().nullable().optional(),

  // --- Step 3: Rollen & Zugang ---
  // The wizard assigns a single primary role (design); mapped to the backend's
  // roleIds array in the action.
  roleId: z.string().uuid().optional(),
  language: z.string().optional().default("de"),
  invitationTiming: InvitationTimingEnum.default("IMMEDIATE"),
}).superRefine((values, ctx) => {
  refineEndDateNotBeforeStart(values, ctx);
});

export type EmployeeOnboardingFormType = z.input<
  typeof EmployeeOnboardingFormSchema
>;
export type EmployeeOnboardingFormOutput = z.output<
  typeof EmployeeOnboardingFormSchema
>;
