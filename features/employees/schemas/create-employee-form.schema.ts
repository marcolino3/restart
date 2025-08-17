// create-employee-form.schema.ts
import { z } from "zod";
import { Persona } from "@/gql/graphql";

export const CreateEmployeeFormSchema = z.object({
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  email: z.email().default(""),
  persona: z.enum(Persona).default(Persona.Employee),
});

// WICHTIG:
export type CreateEmployeeFormType = z.input<typeof CreateEmployeeFormSchema>; // ← fuer RHF (optional durch .default)
export type CreateEmployeeFormOutput = z.output<
  typeof CreateEmployeeFormSchema
>;
