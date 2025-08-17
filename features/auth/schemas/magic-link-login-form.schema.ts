import z from "zod";

export const MagicLinkLoginFormSchema = z.object({
  email: z.email({ error: "Gültige E-Mail-Adresse eingeben." }),
});

export type MagicLinkLoginFormType = z.infer<typeof MagicLinkLoginFormSchema>;
