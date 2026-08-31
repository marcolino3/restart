import { describe, expect, it } from "vitest";

import {
  ABSENCE_CATEGORY_FORM_DEFAULTS,
  createAbsenceCategoryFormSchema,
} from "./employee-absence-category-form.schema";

const schema = createAbsenceCategoryFormSchema({
  atLeastOneNameRequired: "At least one label is required.",
  maxDaysPerRequestNeedsRange: "Needs date range.",
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

  describe("maxDaysAhead", () => {
    const withLabel = {
      ...ABSENCE_CATEGORY_FORM_DEFAULTS,
      translations: ABSENCE_CATEGORY_FORM_DEFAULTS.translations.map((tr) =>
        tr.locale === "DE" ? { ...tr, name: "Krankheit" } : tr,
      ),
    };

    it("accepts 0 (only today), 1 and empty (open future)", () => {
      for (const value of [0, 1, "", null]) {
        const result = schema.safeParse({ ...withLabel, maxDaysAhead: value });
        expect(result.success, `value ${String(value)}`).toBe(true);
      }
      expect(
        schema.parse({ ...withLabel, maxDaysAhead: "" }).maxDaysAhead,
      ).toBe(null);
      expect(
        schema.parse({ ...withLabel, maxDaysAhead: "3" }).maxDaysAhead,
      ).toBe(3);
    });

    it("rejects negative and fractional values", () => {
      expect(schema.safeParse({ ...withLabel, maxDaysAhead: -1 }).success).toBe(
        false,
      );
      expect(
        schema.safeParse({ ...withLabel, maxDaysAhead: 1.5 }).success,
      ).toBe(false);
    });
  });
});
