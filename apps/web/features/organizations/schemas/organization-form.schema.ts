import z from "zod";

export const OrganizationFormSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, { message: "Darf nicht leer sein" })
    .optional()
    .default(""),
  slug: z
    .string()
    .min(1, { message: "Darf nicht leer sein" })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt. Keine Leerzeichen oder Sonderzeichen.",
    })
    .optional()
    .default(""),
  domain: z.string().optional().default(""),
  street: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.email().optional().or(z.literal("")).default(""),
  website: z.string().optional().default(""),
  timezone: z.string().optional().default("Europe/Berlin"),
});

export type OrganizationFormInput = z.input<typeof OrganizationFormSchema>;
export type OrganizationFormOutput = z.output<typeof OrganizationFormSchema>;
