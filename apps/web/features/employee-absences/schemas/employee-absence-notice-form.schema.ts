import z from "zod";

export const EmployeeAbsenceNoticeFormSchema = z.object({
  startDate: z.date().default(new Date()),
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
