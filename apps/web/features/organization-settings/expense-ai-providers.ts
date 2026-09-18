/**
 * AI providers selectable for receipt analysis (class budgets).
 *
 * A receipt can carry personal data (a teacher's name, an address), so the
 * default stays on the EU provider already configured for contracts. Any
 * other vendor is an explicit opt-in by an org admin, shown with a warning.
 *
 * Keys and provider ids are consumed by the backend ExpenseReceiptAiService;
 * keep them in sync with EXPENSE_AI_SETTING_KEYS / EXPENSE_AI_PROVIDERS there.
 */
export const EXPENSE_AI_SETTING_KEYS = {
  provider: "EXPENSE_AI_PROVIDER",
  apiKey: "EXPENSE_AI_API_KEY",
  model: "EXPENSE_AI_MODEL",
} as const;

/** "contracts" reuses the Mistral key of the contract AI settings. */
export const EXPENSE_AI_PROVIDERS = [
  "contracts",
  "mistral",
  "openai",
  "anthropic",
  "google",
] as const;

export type ExpenseAiProvider = (typeof EXPENSE_AI_PROVIDERS)[number];

export const EXPENSE_AI_DEFAULT_PROVIDER: ExpenseAiProvider = "contracts";

/** Error code of the save action when a vendor switch comes without a key. */
export const EXPENSE_AI_KEY_REQUIRED = "EXPENSE_AI_KEY_REQUIRED";

/** Vision-capable defaults — receipts are images or PDFs. */
const DEFAULT_MODELS: Record<Exclude<ExpenseAiProvider, "contracts">, string> =
  {
    mistral: "mistral-small-latest",
    openai: "gpt-5",
    anthropic: "claude-sonnet-5",
    google: "gemini-2.5-pro",
  };

const EU_PROVIDERS: readonly ExpenseAiProvider[] = ["contracts", "mistral"];

export const isExpenseAiProvider = (value: string): value is ExpenseAiProvider =>
  (EXPENSE_AI_PROVIDERS as readonly string[]).includes(value);

/** Default model per provider; "contracts" runs on the Mistral key. */
export const defaultExpenseAiModel = (provider: ExpenseAiProvider): string =>
  DEFAULT_MODELS[provider === "contracts" ? "mistral" : provider];

const MASK = "••••••••";

/**
 * What the form shows of a stored key: its last four characters. Short
 * values stay fully masked so the hint never gives most of a key away.
 */
export const maskApiKey = (value: string): string => {
  const key = value.trim();
  if (!key) return "";
  return key.length >= 12 ? `${MASK}${key.slice(-4)}` : MASK;
};

/** Providers that need their own API key stored under EXPENSE_AI_API_KEY. */
export const expenseAiNeedsOwnKey = (provider: ExpenseAiProvider): boolean =>
  provider !== "contracts";

/** True when receipts would leave the EU — the form must warn about it. */
export const isNonEuExpenseAiProvider = (
  provider: ExpenseAiProvider,
): boolean => !EU_PROVIDERS.includes(provider);
