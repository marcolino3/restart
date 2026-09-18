/**
 * Translation keys (namespace `ClassBudgets`) for the stable error codes of
 * the receipt analysis — keep in sync with `EXPENSE_AI_ERRORS` in the backend.
 */
export const EXPENSE_AI_ERROR_KEYS = {
  EXPENSE_AI_NOT_CONFIGURED: "aiErrorNotConfigured",
  EXPENSE_AI_UNREACHABLE: "aiErrorUnreachable",
  EXPENSE_AI_TIMEOUT: "aiErrorTimeout",
  EXPENSE_AI_KEY_REJECTED: "aiErrorKeyRejected",
  EXPENSE_AI_RATE_LIMITED: "aiErrorRateLimited",
  EXPENSE_AI_CAPACITY: "aiErrorCapacity",
  EXPENSE_AI_QUOTA_EXCEEDED: "aiErrorQuotaExceeded",
  EXPENSE_AI_NO_ALLOWANCE: "aiErrorNoAllowance",
  EXPENSE_AI_FILE_REJECTED: "aiErrorFileRejected",
  EXPENSE_AI_FAILED: "aiErrorFailed",
  EXPENSE_AI_UNUSABLE_ANSWER: "aiErrorUnusableAnswer",
} as const;

export type ExpenseAiErrorKey =
  | (typeof EXPENSE_AI_ERROR_KEYS)[keyof typeof EXPENSE_AI_ERROR_KEYS]
  | "aiErrorTooManyRequests"
  | "aiErrorReceiptMissing"
  | "aiErrorNoAccess";

/**
 * Picks the translation key for whatever the analyse mutation failed with.
 * Unknown text never reaches the user — it falls back to the generic message.
 */
export const expenseAiErrorKey = (
  message: string | null | undefined,
): ExpenseAiErrorKey => {
  const text = message ?? "";
  const code = Object.keys(EXPENSE_AI_ERROR_KEYS).find((c) =>
    text.includes(c),
  ) as keyof typeof EXPENSE_AI_ERROR_KEYS | undefined;
  if (code) return EXPENSE_AI_ERROR_KEYS[code];
  // Our own per-user limit on the mutation, not the provider's.
  if (/ThrottlerException|Too Many Requests/i.test(text)) {
    return "aiErrorTooManyRequests";
  }
  if (/Receipt .* not found/i.test(text)) return "aiErrorReceiptMissing";
  if (/Forbidden|Access denied/i.test(text)) return "aiErrorNoAccess";
  return "aiErrorFailed";
};
