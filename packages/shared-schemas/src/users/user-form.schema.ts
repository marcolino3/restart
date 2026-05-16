import z from "zod";

export const UserFormSchema = z.object({
  id: z.string(),
  email: z.string(),
  description: z.string(),
  birthdate: z.date(),
  items: z.array(z.string()),
  preferredLanguage: z.string(),
  favoriteFruit: z.string(),
  engagementLevel: z.number(),
});

export type UserFormType = z.infer<typeof UserFormSchema>;
