import { z } from "zod";
import { emptyToNull } from "./empty-to-null";

export const zUuidOrNull = z.preprocess(
  emptyToNull,
  z.uuid().nullable().optional(),
);
