import { z } from "zod";

export const EmergencyContactRelationshipEnum = z.enum([
  "SPOUSE",
  "PARTNER",
  "PARENT",
  "CHILD",
  "SIBLING",
  "FRIEND",
  "OTHER",
]);

export const BloodTypeEnum = z.enum([
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
]);

const emailOrEmpty = z
  .string()
  .optional()
  .default("")
  .refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: "Ungültige E-Mail" },
  );

export const EmployeeEmergencyFormSchema = z.object({
  employeeId: z.string().uuid(),
  contact1Name: z.string().optional().default(""),
  contact1Relationship: EmergencyContactRelationshipEnum.or(
    z.literal(""),
  ).optional(),
  contact1Phone: z.string().optional().default(""),
  contact1Email: emailOrEmpty,
  contact2Name: z.string().optional().default(""),
  contact2Relationship: EmergencyContactRelationshipEnum.or(
    z.literal(""),
  ).optional(),
  contact2Phone: z.string().optional().default(""),
  contact2Email: emailOrEmpty,
  bloodType: BloodTypeEnum.or(z.literal("")).optional(),
  allergies: z.string().optional().default(""),
  chronicConditions: z.string().optional().default(""),
  emergencyMedications: z.string().optional().default(""),
  primaryDoctorName: z.string().optional().default(""),
  primaryDoctorPhone: z.string().optional().default(""),
  pharmacyName: z.string().optional().default(""),
});

export type EmployeeEmergencyFormType = z.input<
  typeof EmployeeEmergencyFormSchema
>;
export type EmployeeEmergencyFormOutput = z.output<
  typeof EmployeeEmergencyFormSchema
>;
