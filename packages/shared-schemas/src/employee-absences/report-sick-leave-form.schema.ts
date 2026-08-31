import z from "zod";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Self-service sick report. `startTime` only carries a value when the employee
 * explicitly enables `hasStartTime` — an untouched toggle must never send a
 * time, otherwise every report would look like a mid-day one.
 */
export const ReportSickLeaveFormSchema = z
  .object({
    date: z.date().default(() => new Date()),
    hasStartTime: z.boolean().default(false),
    startTime: z.string().default(""),
    comment: z.string().max(500).default(""),
  })
  .refine(
    (values) => !values.hasStartTime || TIME_PATTERN.test(values.startTime),
    { path: ["startTime"], message: "invalidTime" },
  );

export type ReportSickLeaveFormType = z.input<typeof ReportSickLeaveFormSchema>;

export type ReportSickLeaveFormOutput = z.output<
  typeof ReportSickLeaveFormSchema
>;
