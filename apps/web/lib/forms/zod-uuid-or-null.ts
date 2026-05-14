import { z } from "zod";
import { emptyToNull } from "./zod-empty-to-null";

export const zUuidOrNull = z.preprocess(
  emptyToNull,
  z.uuid().nullable().optional(),
);
