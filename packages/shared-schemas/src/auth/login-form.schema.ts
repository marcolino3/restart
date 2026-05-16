import z from "zod";

export const LoginFormSchema = z.object({
  email: z.string().email("Gueltige E-Mail-Adresse eingeben."),
  password: z.string().min(1, "Passwort eingeben."),
});

export type LoginFormType = z.infer<typeof LoginFormSchema>;
