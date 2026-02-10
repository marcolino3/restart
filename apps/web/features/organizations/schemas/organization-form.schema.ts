import z from "zod";

export const OrganizationFormSchema = z.object({
  id: z.uuidv4(),
  name: z.string().optional().default(""),
});

export type OrganizationFormType = z.infer<typeof OrganizationFormSchema>;
