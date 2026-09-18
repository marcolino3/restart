/**
 * Stable error codes of the receipt analysis. They travel as the exception
 * message, so the web app can translate them instead of showing English
 * backend prose. Keep in sync with `EXPENSE_AI_ERROR_KEYS` in the web app.
 */
export const EXPENSE_AI_ERRORS = {
  notConfigured: 'EXPENSE_AI_NOT_CONFIGURED',
  unreachable: 'EXPENSE_AI_UNREACHABLE',
  timeout: 'EXPENSE_AI_TIMEOUT',
  keyRejected: 'EXPENSE_AI_KEY_REJECTED',
  rateLimited: 'EXPENSE_AI_RATE_LIMITED',
  capacity: 'EXPENSE_AI_CAPACITY',
  quotaExceeded: 'EXPENSE_AI_QUOTA_EXCEEDED',
  fileRejected: 'EXPENSE_AI_FILE_REJECTED',
  failed: 'EXPENSE_AI_FAILED',
  unusableAnswer: 'EXPENSE_AI_UNUSABLE_ANSWER',
} as const;

export type ExpenseAiErrorCode =
  (typeof EXPENSE_AI_ERRORS)[keyof typeof EXPENSE_AI_ERRORS];

export type ProviderErrorInfo = {
  /** Machine-readable type/code of the provider, e.g. `insufficient_quota`. */
  code: string;
  /** Human-readable reason of the provider, shortened and single-line. */
  message: string;
};

const MAX_CODE = 60;
const MAX_MESSAGE = 200;

const isControlChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code < 32 || code === 127;
};

const clean = (value: unknown, max: number): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return Array.from(String(value), (char) => (isControlChar(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
};

/**
 * Pulls type/code/message out of a provider error body. The vendors disagree
 * on the shape: Mistral answers flat (`{ message, type, code }`), OpenAI,
 * Anthropic and Google nest it under `error`.
 */
export const readProviderError = (body: unknown): ProviderErrorInfo => {
  if (!body || typeof body !== 'object') return { code: '', message: '' };
  const root = body as Record<string, unknown>;
  const nested =
    root.error && typeof root.error === 'object'
      ? (root.error as Record<string, unknown>)
      : {};
  const code = [nested.code, nested.type, nested.status, root.code, root.type]
    .map((value) => clean(value, MAX_CODE))
    .filter(Boolean)
    .join('/');
  const message =
    clean(nested.message, MAX_MESSAGE) ||
    clean(root.message, MAX_MESSAGE) ||
    clean(root.error, MAX_MESSAGE) ||
    clean(root.detail, MAX_MESSAGE);
  return { code, message };
};

/**
 * Maps a failed provider response to one of our codes. A 429 means three
 * different things in practice, and only one of them goes away by waiting:
 * a request rate limit, a model that is out of capacity on the key's tier,
 * and a used-up quota.
 */
export const classifyProviderError = (
  status: number,
  info: ProviderErrorInfo,
): ExpenseAiErrorCode => {
  const haystack = `${info.code} ${info.message}`.toLowerCase();
  if (status === 401 || status === 403) return EXPENSE_AI_ERRORS.keyRejected;
  if (
    status === 402 ||
    /insufficient_quota|quota|billing|credit|payment/.test(haystack)
  ) {
    return EXPENSE_AI_ERRORS.quotaExceeded;
  }
  if (status === 429) {
    return /capacity|3505|overloaded/.test(haystack)
      ? EXPENSE_AI_ERRORS.capacity
      : EXPENSE_AI_ERRORS.rateLimited;
  }
  if (status === 503 || status === 529) return EXPENSE_AI_ERRORS.capacity;
  if (status === 400 || status === 413 || status === 415 || status === 422) {
    return EXPENSE_AI_ERRORS.fileRejected;
  }
  return EXPENSE_AI_ERRORS.failed;
};

/** Seconds from a `Retry-After` header, capped; `fallbackMs` when absent. */
export const retryDelayMs = (
  retryAfter: string | null,
  fallbackMs: number,
  maxMs: number,
): number => {
  const seconds = Number(retryAfter);
  if (!retryAfter || !Number.isFinite(seconds) || seconds < 0) {
    return Math.min(fallbackMs, maxMs);
  }
  return Math.min(seconds * 1000, maxMs);
};
