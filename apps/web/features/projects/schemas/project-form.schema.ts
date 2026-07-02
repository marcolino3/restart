import { z } from "zod";

export const ProjectFormSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).optional().nullable(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED"]),
  color: z.string().optional().nullable(),
  // Only used on create; ignored on update (members managed separately).
  memberMembershipIds: z.array(z.string()).optional(),
});

export type ProjectFormValues = z.input<typeof ProjectFormSchema>;
export type ProjectFormOutput = z.output<typeof ProjectFormSchema>;
