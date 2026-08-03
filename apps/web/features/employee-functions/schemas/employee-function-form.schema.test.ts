import { describe, expect, it } from "vitest";

import {
  EMPLOYEE_FUNCTION_FORM_DEFAULTS,
  createEmployeeFunctionFormSchema,
} from "./employee-function-form.schema";

const schema = createEmployeeFunctionFormSchema({
  atLeastOneNameRequired: "At least one label is required.",
});

describe("createEmployeeFunctionFormSchema", () => {
  it("accepts a single DE label with empty optional locales", () => {
    const result = schema.safeParse({
      translations: [
        { locale: "DE", name: "Lehrperson" },
        { locale: "FR", name: "" },
        { locale: "IT", name: "" },
        { locale: "EN", name: "" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.translations[0]?.name).toBe("Lehrperson");
    }
  });

  it("trims whitespace from labels", () => {
    const result = schema.safeParse({
      translations: [
        { locale: "DE", name: "  Lehrperson  " },
        { locale: "FR", name: "" },
        { locale: "IT", name: "" },
        { locale: "EN", name: "" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.translations[0]?.name).toBe("Lehrperson");
    }
  });

  it("rejects when all locale labels are empty", () => {
    const result = schema.safeParse(EMPLOYEE_FUNCTION_FORM_DEFAULTS);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "At least one label is required.",
      );
    }
  });

  it("requires exactly four locale slots", () => {
    const result = schema.safeParse({
      translations: [{ locale: "DE", name: "Lehrperson" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects labels longer than 200 characters", () => {
    const result = schema.safeParse({
      translations: [
        { locale: "DE", name: "a".repeat(201) },
        { locale: "FR", name: "" },
        { locale: "IT", name: "" },
        { locale: "EN", name: "" },
      ],
    });

    expect(result.success).toBe(false);
  });
});
