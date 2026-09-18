/**
 * AI providers selectable for shift planning.
 *
 * Shift planning only sends anonymized data to the provider (pseudonyms,
 * availability, preference levels — no names, ids or salaries), so unlike
 * contract drafting it is not restricted to an EU provider.
 *
 * Setting keys are consumed by the backend shift-plan AI service; keep them
 * in sync with SHIFT_AI_SETTING_KEYS there.
 */
export const SHIFT_AI_SETTING_KEYS = {
  provider: "SHIFT_AI_PROVIDER",
  apiKey: "SHIFT_AI_API_KEY",
  model: "SHIFT_AI_MODEL",
} as const;

/** "contracts" reuses the Mistral key/model of the contract AI settings. */
export const SHIFT_AI_PROVIDERS = [
  "contracts",
  "mistral",
  "openai",
  "anthropic",
  "google",
] as const;

export type ShiftAiProvider = (typeof SHIFT_AI_PROVIDERS)[number];

export const SHIFT_AI_DEFAULT_PROVIDER: ShiftAiProvider = "contracts";

const DEFAULT_MODELS: Record<Exclude<ShiftAiProvider, "contracts">, string> = {
  mistral: "mistral-large-latest",
  openai: "gpt-5",
  anthropic: "claude-sonnet-5",
  google: "gemini-2.5-pro",
};

export const isShiftAiProvider = (value: string): value is ShiftAiProvider =>
  (SHIFT_AI_PROVIDERS as readonly string[]).includes(value);

/** Default model per provider; "contracts" has none (uses contract settings). */
export const defaultShiftAiModel = (provider: ShiftAiProvider): string =>
  provider === "contracts" ? "" : DEFAULT_MODELS[provider];

/** Providers that need their own API key stored under SHIFT_AI_API_KEY. */
export const shiftAiNeedsOwnKey = (provider: ShiftAiProvider): boolean =>
  provider !== "contracts";
