import { z } from "zod";

export const RELATIONSHIP_TYPES = [
  "FATHER",
  "MOTHER",
  "STEP_FATHER",
  "STEP_MOTHER",
  "GRANDFATHER",
  "GRANDMOTHER",
  "SIBLING",
  "NANNY",
  "LEGAL_GUARDIAN",
  "AUNT_UNCLE",
  "OTHER",
] as const;

export const SALUTATIONS = ["MR", "MRS", "DIVERSE", "NONE"] as const;

export const LANGUAGE_CODES = [
  "de", "en", "fr", "it", "es", "pt", "nl", "sv", "no", "da",
  "fi", "el", "pl", "cs", "sk", "hu", "ro", "bg", "hr", "sr",
  "bs", "mk", "sq", "sl", "tr", "ar", "ru", "uk", "zh", "ja",
  "ko", "hi", "fa", "he", "th", "vi",
] as const;

export const ContactPersonFormSchema = z.object({
  id: z.string().uuid().optional(),
  salutation: z.string().optional().default(""),
  title: z.string().optional().default(""),
  firstName: z.string().min(1),
  middleName: z.string().optional().default(""),
  lastName: z.string().min(1),
  email: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Invalid email",
    }),
  phone: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  dateOfBirth: z.date().nullable().optional(),
  socialSecurityNumber: z.string().optional().default(""),
  nationalities: z.array(z.string()).optional().default([]),
  preferredLanguages: z.array(z.string()).optional().default([]),
  roles: z.array(z.string()).optional().default([]),
  occupation: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  // Address fields
  addressId: z.string().uuid().nullable().optional(),
  street: z.string().optional().default(""),
  houseNumber: z.string().optional().default(""),
  addressLine2: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
});

export type ContactPersonFormType = z.input<typeof ContactPersonFormSchema>;
export type ContactPersonFormOutput = z.output<typeof ContactPersonFormSchema>;
