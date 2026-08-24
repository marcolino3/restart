import z from "zod";

/** Approval state of an absence; mirrors the backend enum EmployeeAbsenceStatus. */
export const EmployeeAbsenceStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type EmployeeAbsenceStatusType =
  (typeof EmployeeAbsenceStatus)[keyof typeof EmployeeAbsenceStatus];

export const ABSENCE_CALENDAR_TITLE_DEFAULT =
  "{firstName} {lastName} {category}";

export const EmployeeAbsenceNoticeFormSchema = z.object({
  startDate: z.date().default(new Date()),
  endDate: z.date().optional(),
  absenceCategoryId: z.string().default(""),
  note: z.string().default(""),
  isTeamInformed: z.boolean().default(true),
  syncToCalendar: z.boolean().default(true),
  // Placeholders are resolved by the backend when the calendar event is written.
  calendarTitle: z
    .string()
    .trim()
    .max(200)
    .default(ABSENCE_CALENDAR_TITLE_DEFAULT),
});

export type EmployeeAbsenceNoticeFormType = z.input<
  typeof EmployeeAbsenceNoticeFormSchema
>;

export type EmployeeAbsenceNoticeFormOutput = z.output<
  typeof EmployeeAbsenceNoticeFormSchema
>;

export {
  absenceNoticeDayCount,
  absenceNoticeErrorCode,
  checkAbsenceNoticeDates,
  type AbsenceNoticeCategoryRules,
  type AbsenceNoticeDateErrorCode,
} from "./absence-notice-rules";
