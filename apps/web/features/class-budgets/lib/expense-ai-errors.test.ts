import { describe, expect, it } from "vitest";

import de from "@restart/shared-i18n/messages/de";
import en from "@restart/shared-i18n/messages/en";

import { EXPENSE_AI_ERROR_KEYS, expenseAiErrorKey } from "./expense-ai-errors";

describe("expenseAiErrorKey", () => {
  it("maps the backend codes, also inside a longer message", () => {
    expect(expenseAiErrorKey("EXPENSE_AI_RATE_LIMITED")).toBe(
      "aiErrorRateLimited",
    );
    expect(expenseAiErrorKey("Bad Gateway: EXPENSE_AI_QUOTA_EXCEEDED")).toBe(
      "aiErrorQuotaExceeded",
    );
  });

  it("tells our own request limit apart from the provider's", () => {
    expect(expenseAiErrorKey("ThrottlerException: Too Many Requests")).toBe(
      "aiErrorTooManyRequests",
    );
  });

  it("never passes unknown backend text on to the user", () => {
    expect(expenseAiErrorKey("connect ECONNREFUSED 10.0.0.5:4001")).toBe(
      "aiErrorFailed",
    );
    expect(expenseAiErrorKey(undefined)).toBe("aiErrorFailed");
  });

  it("has a German and an English text for every key", () => {
    const keys = [
      ...Object.values(EXPENSE_AI_ERROR_KEYS),
      "aiErrorTooManyRequests",
      "aiErrorReceiptMissing",
      "aiErrorNoAccess",
    ];
    for (const key of keys) {
      expect(de.ClassBudgets).toHaveProperty(key);
      expect(en.ClassBudgets).toHaveProperty(key);
    }
  });
});
