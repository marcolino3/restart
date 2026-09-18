/**
 * Provider adapters for receipt analysis. Pure request builders and response
 * readers — no I/O — so every provider shape is unit-testable without network.
 *
 * API keys travel in headers only, never in a URL (URLs end up in logs).
 */
export const EXPENSE_AI_PROVIDERS = [
  'contracts',
  'mistral',
  'openai',
  'anthropic',
  'google',
] as const;

export type ExpenseAiProvider = (typeof EXPENSE_AI_PROVIDERS)[number];

/** The vendor actually called; "contracts" resolves to Mistral. */
export type ExpenseAiVendor = Exclude<ExpenseAiProvider, 'contracts'>;

export const EXPENSE_AI_DEFAULT_PROVIDER: ExpenseAiProvider = 'contracts';

/** Defaults must be vision-capable — receipts are images or PDFs. */
export const EXPENSE_AI_DEFAULT_MODELS: Record<ExpenseAiVendor, string> = {
  mistral: 'mistral-small-latest',
  openai: 'gpt-5',
  anthropic: 'claude-sonnet-5',
  google: 'gemini-2.5-pro',
};

export const isExpenseAiProvider = (
  value: string | null | undefined,
): value is ExpenseAiProvider =>
  (EXPENSE_AI_PROVIDERS as readonly string[]).includes(value ?? '');

export interface ExpenseAiRequestInput {
  vendor: ExpenseAiVendor;
  apiKey: string;
  model: string;
  prompt: string;
  file: { base64: string; mimeType: string };
}

export interface ExpenseAiHttpRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

const MAX_OUTPUT_TOKENS = 1024;

export function buildExpenseAiRequest(
  input: ExpenseAiRequestInput,
): ExpenseAiHttpRequest {
  const { vendor, apiKey, model, prompt, file } = input;
  const dataUri = `data:${file.mimeType};base64,${file.base64}`;
  const isPdf = file.mimeType === 'application/pdf';

  switch (vendor) {
    case 'mistral':
      return {
        url: 'https://api.mistral.ai/v1/chat/completions',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model,
          temperature: 0,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                isPdf
                  ? { type: 'document_url', document_url: dataUri }
                  : { type: 'image_url', image_url: dataUri },
              ],
            },
          ],
        },
      };
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                isPdf
                  ? {
                      type: 'file',
                      file: { filename: 'receipt.pdf', file_data: dataUri },
                    }
                  : { type: 'image_url', image_url: { url: dataUri } },
              ],
            },
          ],
        },
      };
    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: {
          model,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: isPdf ? 'document' : 'image',
                  source: {
                    type: 'base64',
                    media_type: file.mimeType,
                    data: file.base64,
                  },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        },
      };
    case 'google':
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        headers: { 'x-goog-api-key': apiKey },
        body: {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: { mime_type: file.mimeType, data: file.base64 },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        },
      };
  }
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const textOfParts = (parts: unknown): string =>
  Array.isArray(parts)
    ? parts
        .map((part) => {
          const text = asRecord(part)?.text;
          return typeof text === 'string' ? text : '';
        })
        .join('')
    : '';

/** Pulls the model's text out of a provider response; '' when there is none. */
export function readExpenseAiText(
  vendor: ExpenseAiVendor,
  response: unknown,
): string {
  const root = asRecord(response);
  if (!root) return '';

  switch (vendor) {
    case 'mistral':
    case 'openai': {
      const first: unknown = Array.isArray(root.choices)
        ? root.choices[0]
        : null;
      const content = asRecord(asRecord(first)?.message)?.content;
      return typeof content === 'string' ? content : textOfParts(content);
    }
    case 'anthropic':
      return textOfParts(root.content);
    case 'google': {
      const first: unknown = Array.isArray(root.candidates)
        ? root.candidates[0]
        : null;
      return textOfParts(asRecord(asRecord(first)?.content)?.parts);
    }
  }
}
