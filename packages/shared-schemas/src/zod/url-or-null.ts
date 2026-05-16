import z from "zod";
import { emptyToNull } from "./empty-to-null";

export const urlOrNull = z.preprocess(emptyToNull, z.url().nullable());
