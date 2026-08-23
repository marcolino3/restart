import z from "zod";

/** Approval state of an absence; mirrors the backend enum EmployeeAbsenceStatus. */
export const EmployeeAbsenceStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type EmployeeAbsenceStatusType =
  (typeof EmployeeAbsenceStatus)[keyof typeof EmployeeAbsenceStatus];

export const EmployeeAbsenceNoticeFormSchema = z.object({
  startDate: z.date().default(new Date()),
  endDate: z.date().optional(),
  absenceCategoryId: z.string().default(""),
  note: z.string().default(""),
  isTeamInformed: z.boolean().default(true),
});

export type EmployeeAbsenceNoticeFormType = z.input<
  typeof EmployeeAbsenceNoticeFormSchema
>;

export type EmployeeAbsenceNoticeFormOutput = z.output<
  typeof EmployeeAbsenceNoticeFormSchema
>;

const startOfDay = (value: Date) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Self-service date rules. A notice category (`requiresApproval = false`) only
 * covers today or tomorrow and is definitive at once; a request category may
 * lie anywhere in the future and waits for a decision.
 */
export function checkAbsenceNoticeDates(
  values: { startDate?: Date | null; endDate?: Date | null },
  requiresApproval: boolean,
): { field: "startDate" | "endDate"; code: "past" | "tooFar" | "endBeforeStart" } | null {
  const start = values.startDate ? startOfDay(values.startDate) : null;
  if (!start) return null;
  const today = startOfDay(new Date());
  if (start < today) return { field: "startDate", code: "past" };
  if (!requiresApproval) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (start > tomorrow) return { field: "startDate", code: "tooFar" };
  }
  const end = values.endDate ? startOfDay(values.endDate) : null;
  if (end && end < start) return { field: "endDate", code: "endBeforeStart" };
  return null;
}
