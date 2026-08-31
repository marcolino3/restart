import z from "zod";
import { parseAbsenceDateTime, startOfLocalDay } from "./absence-date";
import { AbsenceDocumentSchema } from "./absence-document";

const dateRequired = z.preprocess((v) => {
  const parsed = parseAbsenceDateTime(v);
  return parsed ?? v;
}, z.date());

const dateNullable = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  const parsed = parseAbsenceDateTime(v);
  return parsed ?? v;
}, z.date().nullable());

/** Admin create/edit form for an employee absence (dedicated pages). */
export const EmployeeAbsenceFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    employeeId: z.string().uuid(),
    startDate: dateRequired,
    endDate: dateNullable.optional(),
    includesTime: z.boolean().default(false),
    absenceCategoryId: z.string().uuid({ message: "required" }),
    note: z.string().default(""),
    isTeamInformed: z.boolean().default(true),
    isVacationCapable: z.boolean().default(true),
    percentage: z.number().int().min(1).max(100).default(100),
    certificates: z.array(AbsenceDocumentSchema).default([]),
    additionalDocuments: z.array(AbsenceDocumentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const start = parseAbsenceDateTime(data.startDate);
    const end = parseAbsenceDateTime(data.endDate);
    if (!start || !end) return;
    if (data.includesTime) {
      if (end.getTime() < start.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "endBeforeStart",
        });
      }
      return;
    }
    if (startOfLocalDay(end).getTime() < startOfLocalDay(start).getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endBeforeStart",
      });
    }
  });

export type EmployeeAbsenceFormType = z.input<typeof EmployeeAbsenceFormSchema>;
export type EmployeeAbsenceFormOutput = z.output<
  typeof EmployeeAbsenceFormSchema
>;
