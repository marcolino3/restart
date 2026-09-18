import { describe, expect, it } from "vitest";

import {
  defaultExpenseAiModel,
  expenseAiNeedsOwnKey,
  isExpenseAiProvider,
  isNonEuExpenseAiProvider,
  maskApiKey,
} from "@/features/organization-settings/expense-ai-providers";
import type { ExpenseReceiptSuggestion } from "../types";
import { receiptSuggestionPatch } from "./apply-receipt-suggestion";

const empty: ExpenseReceiptSuggestion = {
  vendor: null,
  invoiceNumber: null,
  expenseDate: null,
  amount: null,
  currency: null,
  description: null,
  suggestedCategoryId: null,
  confidence: null,
};
const TODAY = "2026-09-18";

describe("receiptSuggestionPatch", () => {
  it("takes over everything the AI read", () => {
    expect(
      receiptSuggestionPatch(
        {
          ...empty,
          vendor: "Migros",
          invoiceNumber: "R-1",
          expenseDate: "2026-09-12",
          amount: 12.5,
          description: "Znüni",
          suggestedCategoryId: "cat-1",
        },
        ["cat-1", "cat-2"],
        TODAY,
      ),
    ).toEqual({
      vendor: "Migros",
      invoiceNumber: "R-1",
      expenseDate: "2026-09-12",
      amount: 12.5,
      description: "Znüni",
      categoryId: "cat-1",
    });
  });

  it("never wipes typed values with an empty suggestion", () => {
    expect(receiptSuggestionPatch(empty, ["cat-1"], TODAY)).toEqual({});
  });

  it("ignores a category that is not selectable in the form", () => {
    const patch = receiptSuggestionPatch(
      { ...empty, suggestedCategoryId: "archived-or-foreign" },
      ["cat-1"],
      TODAY,
    );
    expect(patch).not.toHaveProperty("categoryId");
  });

  it("ignores a future date and a non-positive amount", () => {
    const patch = receiptSuggestionPatch(
      { ...empty, expenseDate: "2026-09-19", amount: 0 },
      [],
      TODAY,
    );
    expect(patch).toEqual({});
  });
});

describe("expense AI providers", () => {
  it("warns for every provider outside the EU, and only for those", () => {
    expect(isNonEuExpenseAiProvider("contracts")).toBe(false);
    expect(isNonEuExpenseAiProvider("mistral")).toBe(false);
    expect(isNonEuExpenseAiProvider("openai")).toBe(true);
    expect(isNonEuExpenseAiProvider("anthropic")).toBe(true);
    expect(isNonEuExpenseAiProvider("google")).toBe(true);
  });

  it("reuses the contract key only for the default provider", () => {
    expect(expenseAiNeedsOwnKey("contracts")).toBe(false);
    expect(expenseAiNeedsOwnKey("mistral")).toBe(true);
    expect(defaultExpenseAiModel("contracts")).toBe("mistral-small-latest");
    expect(defaultExpenseAiModel("mistral")).toBe("mistral-small-latest");
  });

  it("shows only the last four characters of a stored key", () => {
    expect(maskApiKey("sk-1234567890abcd")).toBe("••••••••abcd");
    expect(maskApiKey("  sk-1234567890abcd  ")).toBe("••••••••abcd");
    // A short value would give most of itself away.
    expect(maskApiKey("short-key")).toBe("••••••••");
    expect(maskApiKey("")).toBe("");
  });

  it("rejects unknown provider ids", () => {
    expect(isExpenseAiProvider("openai")).toBe(true);
    expect(isExpenseAiProvider("evil")).toBe(false);
  });
});
