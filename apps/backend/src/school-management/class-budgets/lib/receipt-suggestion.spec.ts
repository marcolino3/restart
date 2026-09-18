import {
  buildExpenseAiRequest,
  isExpenseAiProvider,
  readExpenseAiText,
} from './expense-ai-providers';
import {
  buildReceiptPrompt,
  parseReceiptSuggestion,
} from './receipt-suggestion';

const categories = [
  { id: 'cat-material', name: 'Material' },
  { id: 'cat-trips', name: 'Ausflüge' },
];

describe('parseReceiptSuggestion', () => {
  it('accepts a clean answer and maps the category name to its id', () => {
    const text = JSON.stringify({
      vendor: ' Papeterie Muster AG ',
      invoiceNumber: 'R-2026-118',
      expenseDate: '2026-09-12',
      amount: 84.35,
      currency: 'chf',
      description: 'Bastelmaterial',
      categoryName: 'material',
      confidence: 0.92,
    });
    expect(parseReceiptSuggestion(text, categories)).toEqual({
      vendor: 'Papeterie Muster AG',
      invoiceNumber: 'R-2026-118',
      expenseDate: '2026-09-12',
      amount: 84.35,
      currency: 'CHF',
      description: 'Bastelmaterial',
      suggestedCategoryId: 'cat-material',
      confidence: 0.92,
    });
  });

  it('reads JSON wrapped in a code fence or prose', () => {
    const text =
      'Here you go:\n```json\n{"vendor":"Migros","amount":"12,50"}\n```';
    expect(parseReceiptSuggestion(text, categories)).toMatchObject({
      vendor: 'Migros',
      amount: 12.5,
    });
  });

  it('returns null for output that is not a JSON object', () => {
    expect(parseReceiptSuggestion('sorry, no idea', categories)).toBeNull();
    expect(parseReceiptSuggestion('{"vendor": "x"', categories)).toBeNull();
    expect(parseReceiptSuggestion('[1,2]', categories)).toBeNull();
  });

  it('never accepts a category that is not one of the org', () => {
    const foreignId = JSON.stringify({ categoryName: 'cat-material' });
    const unknown = JSON.stringify({ categoryName: 'Spenden' });
    const injected = JSON.stringify({
      categoryName: 'Material',
      suggestedCategoryId: 'id-of-another-org',
    });
    expect(
      parseReceiptSuggestion(foreignId, categories)?.suggestedCategoryId,
    ).toBeNull();
    expect(
      parseReceiptSuggestion(unknown, categories)?.suggestedCategoryId,
    ).toBeNull();
    expect(
      parseReceiptSuggestion(injected, categories)?.suggestedCategoryId,
    ).toBe('cat-material');
  });

  it('drops each invalid field on its own instead of failing the whole answer', () => {
    const text = JSON.stringify({
      vendor: 42,
      invoiceNumber: 'x'.repeat(500),
      expenseDate: '2026-02-31',
      amount: -5,
      currency: 'Franken',
      description: 'ok\u0000\u0007 text',
      confidence: 7,
    });
    expect(parseReceiptSuggestion(text, categories)).toEqual({
      vendor: null,
      invoiceNumber: 'x'.repeat(100),
      expenseDate: null,
      amount: null,
      currency: null,
      description: 'ok text',
      suggestedCategoryId: null,
      confidence: 1,
    });
  });

  it('rounds to Rappen and rejects absurd amounts', () => {
    const amountOf = (amount: unknown) =>
      parseReceiptSuggestion(JSON.stringify({ amount }), categories)?.amount;
    expect(amountOf(19.999)).toBe(20);
    expect(amountOf(0)).toBeNull();
    expect(amountOf(1e15)).toBeNull();
    expect(amountOf('abc')).toBeNull();
  });
});

describe('buildReceiptPrompt', () => {
  it('sends category names only — never ids', () => {
    const prompt = buildReceiptPrompt(categories);
    expect(prompt).toContain('- Material');
    expect(prompt).toContain('- Ausflüge');
    expect(prompt).not.toContain('cat-material');
  });

  it('forces a null category when the org has none', () => {
    expect(buildReceiptPrompt([])).toContain('"categoryName" must be null');
  });
});

describe('expense AI provider adapters', () => {
  const base = {
    apiKey: 'secret-key',
    model: 'some-model',
    prompt: 'PROMPT',
  };
  const pdf = { base64: 'UERG', mimeType: 'application/pdf' };
  const png = { base64: 'UE5H', mimeType: 'image/png' };

  it('knows its providers', () => {
    expect(isExpenseAiProvider('contracts')).toBe(true);
    expect(isExpenseAiProvider('anthropic')).toBe(true);
    expect(isExpenseAiProvider('evil')).toBe(false);
    expect(isExpenseAiProvider(null)).toBe(false);
  });

  it.each(['mistral', 'openai', 'anthropic', 'google'] as const)(
    'keeps the %s API key out of URL and body',
    (vendor) => {
      const request = buildExpenseAiRequest({ ...base, vendor, file: pdf });
      expect(request.url.startsWith('https://')).toBe(true);
      expect(request.url).not.toContain('secret-key');
      expect(JSON.stringify(request.body)).not.toContain('secret-key');
      expect(JSON.stringify(request.headers)).toContain('secret-key');
    },
  );

  it('sends PDFs and images in the shape each provider expects', () => {
    const body = (
      vendor: 'mistral' | 'openai' | 'anthropic',
      file: typeof pdf,
    ) => JSON.stringify(buildExpenseAiRequest({ ...base, vendor, file }).body);

    expect(body('mistral', pdf)).toContain('"document_url"');
    expect(body('mistral', png)).toContain('"image_url"');
    expect(body('openai', pdf)).toContain('"file_data"');
    expect(body('openai', png)).toContain('data:image/png;base64,UE5H');
    expect(body('anthropic', pdf)).toContain('"type":"document"');
    expect(body('anthropic', png)).toContain('"type":"image"');
  });

  it('reads the answer text from every response shape', () => {
    const chat = { choices: [{ message: { content: '{"a":1}' } }] };
    expect(readExpenseAiText('mistral', chat)).toBe('{"a":1}');
    expect(readExpenseAiText('openai', chat)).toBe('{"a":1}');
    expect(
      readExpenseAiText('anthropic', {
        content: [
          { type: 'text', text: '{"a":' },
          { type: 'text', text: '1}' },
        ],
      }),
    ).toBe('{"a":1}');
    expect(
      readExpenseAiText('google', {
        candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }],
      }),
    ).toBe('{"a":1}');
  });

  it('yields an empty string for malformed responses', () => {
    expect(readExpenseAiText('openai', null)).toBe('');
    expect(readExpenseAiText('openai', { choices: [] })).toBe('');
    expect(readExpenseAiText('anthropic', { content: 'nope' })).toBe('');
    expect(readExpenseAiText('google', { candidates: [{}] })).toBe('');
  });
});
