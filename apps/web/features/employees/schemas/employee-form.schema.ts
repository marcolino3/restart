import { z } from "zod";
import { Persona } from "@/gql/graphql";

export const EmployeeFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().optional().default(""),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  persona: z.nativeEnum(Persona).default(Persona.Employee),
  dateOfBirth: z.date().nullable().optional(),
  socialSecurityNumber: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  timeTrackingEnabled: z.boolean().default(false),
  street: z.string().optional().default(""),
  houseNumber: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
});

export type EmployeeFormType = z.input<typeof EmployeeFormSchema>;
export type EmployeeFormOutput = z.output<typeof EmployeeFormSchema>;
