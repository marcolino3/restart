import { describe, expect, it } from "vitest";

import {
  ABSENCE_CATEGORY_FORM_DEFAULTS,
  createAbsenceCategoryFormSchema,
} from "./employee-absence-category-form.schema";

const schema = createAbsenceCategoryFormSchema({
  atLeastOneNameRequired: "At least one label is required.",
});

describe("createAbsenceCategoryFormSchema", () => {
  it("accepts a single DE label with empty optional locales", () => {
    const result = schema.safeParse({
      ...ABSENCE_CATEGORY_FORM_DEFAULTS,
      translations: [
        { locale: "DE", name: "Krankheit" },
        { locale: "FR", name: "" },
        { locale: "IT", name: "" },
        { locale: "EN", name: "" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a single EN label with empty optional locales", () => {
    const result = schema.safeParse({
      ...ABSENCE_CATEGORY_FORM_DEFAULTS,
      translations: [
        { locale: "DE", name: "" },
        { locale: "FR", name: "" },
        { locale: "IT", name: "" },
        { locale: "EN", name: "Sick leave" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects when all locale labels are empty", () => {
    const result = schema.safeParse(ABSENCE_CATEGORY_FORM_DEFAULTS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "At least one label is required.",
      );
    }
  });
});
