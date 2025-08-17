import z from "zod";

export const CreateOrganizationSlugFormSchema = z.object({
  slug: z
    .string()
    .min(1, { message: "Darf nicht leer sein" })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt. Keine Leerzeichen oder Sonderzeichen.",
    }),
});

export type CreateOrganizationSlugFormType = z.infer<
  typeof CreateOrganizationSlugFormSchema
>;
