import { describe, expect, it } from "vitest";

import { parseBudgetAmount } from "./class-budget-form.schema";
import {
  createClassExpenseFormSchema,
  hasAtMostTwoDecimals,
  toClassExpenseInput,
  type ClassExpenseFormValues,
} from "./class-expense-form.schema";
import { expenseCategoryNameSchema } from "./expense-category-form.schema";

const schema = createClassExpenseFormSchema((key) => key);

const valid: ClassExpenseFormValues = {
  schoolClassId: "class-1",
  categoryId: "category-1",
  expenseDate: "2026-09-18",
  amount: 42.5,
  vendor: " Papeterie Muster ",
  invoiceNumber: "",
  description: "   ",
  receiptFileId: null,
};

describe("class expense form schema", () => {
  it("accepts a complete expense", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["zero amount", { amount: 0 }],
    ["negative amount", { amount: -5 }],
    ["three decimals", { amount: 10.555 }],
    ["missing class", { schoolClassId: "" }],
    ["missing category", { categoryId: "" }],
    ["malformed date", { expenseDate: "18.09.2026" }],
    ["vendor too long", { vendor: "x".repeat(201) }],
    ["invoice number too long", { invoiceNumber: "x".repeat(101) }],
  ])("rejects %s", (_label, patch) => {
    expect(schema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("reports the translated message key", () => {
    const result = schema.safeParse({ ...valid, amount: 10.555 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("validation.decimals");
    }
  });

  it("does not mistake float representation for a third decimal", () => {
    expect(hasAtMostTwoDecimals(8.7)).toBe(true);
    expect(hasAtMostTwoDecimals(0.1 + 0.2)).toBe(true);
    expect(hasAtMostTwoDecimals(1.005)).toBe(false);
  });

  it("maps blank optional text to null and trims the rest", () => {
    expect(toClassExpenseInput(valid)).toEqual({
      schoolClassId: "class-1",
      categoryId: "category-1",
      expenseDate: "2026-09-18",
      amount: 42.5,
      vendor: "Papeterie Muster",
      invoiceNumber: null,
      description: null,
      receiptFileId: null,
    });
  });
});

describe("parseBudgetAmount", () => {
  it.each([
    ["1500", 1500],
    ["1500.5", 1500.5],
    ["1'500.50", 1500.5],
    ["1 500,50", 1500.5],
    ["0", 0],
  ])("parses %s", (raw, expected) => {
    expect(parseBudgetAmount(raw)).toBe(expected);
  });

  it.each(["", "abc", "-10", "10.555", "1e5", "10.", "99999999999"])(
    "rejects %s",
    (raw) => {
      expect(parseBudgetAmount(raw)).toBeNull();
    },
  );
});

describe("expense category name", () => {
  it("trims and bounds the name", () => {
    expect(expenseCategoryNameSchema.parse("  Material ")).toBe("Material");
    expect(expenseCategoryNameSchema.safeParse("   ").success).toBe(false);
    expect(expenseCategoryNameSchema.safeParse("x".repeat(121)).success).toBe(
      false,
    );
  });
});
