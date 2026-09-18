import { ExpenseAiVendor } from './expense-ai-providers';

/**
 * Model discovery for the receipt analysis settings: the org admin picks the
 * model from what the stored key can actually use instead of typing an id.
 */
export interface ExpenseAiModelOption {
  id: string;
  displayName: string | null;
}

export interface ExpenseAiModelsRequest {
  url: string;
  headers: Record<string, string>;
}

const MAX_MODELS = 200;
const MAX_ID = 120;

export function buildExpenseAiModelsRequest(
  vendor: ExpenseAiVendor,
  apiKey: string,
): ExpenseAiModelsRequest {
  switch (vendor) {
    case 'mistral':
      return {
        url: 'https://api.mistral.ai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
      };
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
      };
    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/models?limit=100',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      };
    case 'google':
      // The key travels as a header, never in the URL, so it cannot end up
      // in a proxy or access log.
      return {
        url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
        headers: { 'x-goog-api-key': apiKey },
      };
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asList = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

// OpenAI lists every model of the account without capabilities; receipts
// need a chat model that reads images.
const OPENAI_CHAT = /^(gpt-|o\d|chatgpt-)/;
const OPENAI_NOT_VISION =
  /audio|realtime|tts|transcribe|embedding|image|search|instruct|moderation|codex|gpt-3\.5/;

/**
 * Reads the vendor's model list and keeps the models that can read a receipt
 * (image or PDF input). Unknown shapes yield an empty list, never an error.
 */
export function parseExpenseAiModels(
  vendor: ExpenseAiVendor,
  body: unknown,
): ExpenseAiModelOption[] {
  const root = asRecord(body);
  let options: ExpenseAiModelOption[];

  switch (vendor) {
    case 'mistral':
      options = asList(root.data)
        .filter((model) => asRecord(model.capabilities).vision === true)
        .map((model) => ({ id: text(model.id) ?? '', displayName: null }));
      break;
    case 'openai':
      options = asList(root.data)
        .map((model) => ({ id: text(model.id) ?? '', displayName: null }))
        .filter(
          ({ id }) => OPENAI_CHAT.test(id) && !OPENAI_NOT_VISION.test(id),
        );
      break;
    case 'anthropic':
      options = asList(root.data).map((model) => ({
        id: text(model.id) ?? '',
        displayName: text(model.display_name),
      }));
      break;
    case 'google':
      options = asList(root.models)
        .filter(
          (model) =>
            Array.isArray(model.supportedGenerationMethods) &&
            model.supportedGenerationMethods.includes('generateContent'),
        )
        .map((model) => ({
          id: (text(model.name) ?? '').replace(/^models\//, ''),
          displayName: text(model.displayName),
        }))
        .filter(({ id }) => id.startsWith('gemini'));
      break;
  }

  const seen = new Set<string>();
  return options
    .filter(({ id }) => {
      if (!id || id.length > MAX_ID || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, MAX_MODELS);
}
