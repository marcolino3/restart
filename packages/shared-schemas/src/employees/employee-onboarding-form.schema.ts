import { z } from "zod";
import { Persona } from "@restart/shared-types/graphql";
import { EmployeeContractTypeEnum } from "./employee-contract-form.schema";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const TimeWindowSchema = z.object({
  start: z.string().regex(HHMM),
  end: z.string().regex(HHMM),
});
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

export const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const WeekdayTimeWindowsSchema = z.object({
  mon: z.array(TimeWindowSchema).optional(),
  tue: z.array(TimeWindowSchema).optional(),
  wed: z.array(TimeWindowSchema).optional(),
  thu: z.array(TimeWindowSchema).optional(),
  fri: z.array(TimeWindowSchema).optional(),
  sat: z.array(TimeWindowSchema).optional(),
  sun: z.array(TimeWindowSchema).optional(),
});
export type WeekdayTimeWindows = z.infer<typeof WeekdayTimeWindowsSchema>;

export const InvitationTimingEnum = z.enum([
  "IMMEDIATE",
  "ON_ENTRY_DATE",
  "MANUAL",
]);

const intPercentOrNull = z
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
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  persona: z.nativeEnum(Persona).default(Persona.Employee),
  dateOfBirth: z.date().nullable().optional(),
  socialSecurityNumber: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
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
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  workloadPercent: intPercentOrNull,
  weeklyHours: z.string().optional().default(""),
  annualVacationDays: intOrNull,
  weekdayTimeWindows: WeekdayTimeWindowsSchema.optional(),
  teamId: z.string().uuid().nullable().optional(),

  // --- Step 3: Rollen & Zugang ---
  roleIds: z.array(z.string().uuid()).optional().default([]),
  language: z.string().optional().default("de"),
  invitationTiming: InvitationTimingEnum.default("IMMEDIATE"),
});

export type EmployeeOnboardingFormType = z.input<
  typeof EmployeeOnboardingFormSchema
>;
export type EmployeeOnboardingFormOutput = z.output<
  typeof EmployeeOnboardingFormSchema
>;
