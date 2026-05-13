import { z } from "zod";

export const zOptionalDate = () =>
  z
    .union([z.string(), z.date()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .pipe(z.date())
    .optional();
