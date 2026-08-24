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
  entryMode: z.enum(["DAY", "HALF_DAY", "TIME"]).default("DAY"),
  dayPart: z.enum(["FULL", "MORNING", "AFTERNOON"]).default("FULL"),
  /** "HH:mm", only for TIME categories. */
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export type EmployeeAbsenceNoticeFormType = z.input<
  typeof EmployeeAbsenceNoticeFormSchema
>;

export type EmployeeAbsenceNoticeFormOutput = z.output<
  typeof EmployeeAbsenceNoticeFormSchema
>;

export {
  AbsenceDayPart,
  AbsenceEntryPrecision,
  absenceNoticeDayCount,
  absenceNoticeErrorCode,
  checkAbsenceNoticeDates,
  checkAbsenceNoticeTiming,
  allowedAbsenceEntryModes,
  type AbsenceDayPartType,
  type AbsenceEntryPrecisionType,
  type AbsenceEntryModeType,
  type AbsenceNoticeCategoryRules,
  type AbsenceNoticeDateErrorCode,
  type AbsenceNoticeErrorField,
} from "./absence-notice-rules";
