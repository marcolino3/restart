import { z } from "zod";

export const BREACH_STATUSES = [
  "OPEN",
  "INVESTIGATING",
  "CONTAINED",
  "CLOSED",
] as const;

export const BREACH_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

export type DataBreachStatus = (typeof BREACH_STATUSES)[number];
export type DataBreachRiskLevel = (typeof BREACH_RISK_LEVELS)[number];

/** Frontend validation for the "record incident" form; mirrors the backend DTO. */
export const DataBreachFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  detectedAt: z.date().optional(),
  riskLevel: z.enum(BREACH_RISK_LEVELS).default("MEDIUM"),
  affectedScope: z.string().max(2000).optional().default(""),
  affectedCount: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(2000).optional().default(""),
});

export type DataBreachFormType = z.input<typeof DataBreachFormSchema>;
export type DataBreachFormOutput = z.output<typeof DataBreachFormSchema>;
