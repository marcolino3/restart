import {
  buildExpenseAiModelsRequest,
  parseExpenseAiModels,
} from './expense-ai-models';

describe('buildExpenseAiModelsRequest', () => {
  it('never puts the key into the URL', () => {
    for (const vendor of [
      'mistral',
      'openai',
      'anthropic',
      'google',
    ] as const) {
      const request = buildExpenseAiModelsRequest(vendor, 'secret-key');
      expect(request.url).not.toContain('secret-key');
      expect(JSON.stringify(request.headers)).toContain('secret-key');
    }
  });
});

describe('parseExpenseAiModels', () => {
  it('keeps only the vision models of Mistral, sorted and without duplicates', () => {
    const models = parseExpenseAiModels('mistral', {
      data: [
        { id: 'pixtral-large-latest', capabilities: { vision: true } },
        { id: 'mistral-embed', capabilities: { vision: false } },
        { id: 'mistral-large-latest', capabilities: { vision: true } },
        { id: 'mistral-large-latest', capabilities: { vision: true } },
        { id: 'codestral-latest' },
      ],
    });
    expect(models.map((model) => model.id)).toEqual([
      'mistral-large-latest',
      'pixtral-large-latest',
    ]);
  });

  it('drops the OpenAI models that cannot read an image', () => {
    const models = parseExpenseAiModels('openai', {
      data: [
        { id: 'gpt-5' },
        { id: 'gpt-4o-audio-preview' },
        { id: 'text-embedding-3-large' },
        { id: 'gpt-image-1' },
        { id: 'o3' },
      ],
    });
    expect(models.map((model) => model.id)).toEqual(['gpt-5', 'o3']);
  });

  it('reads the display names of Anthropic', () => {
    expect(
      parseExpenseAiModels('anthropic', {
        data: [{ id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5' }],
      }),
    ).toEqual([{ id: 'claude-sonnet-5', displayName: 'Claude Sonnet 5' }]);
  });

  it('keeps the Gemini models that generate content and strips the prefix', () => {
    const models = parseExpenseAiModels('google', {
      models: [
        {
          name: 'models/gemini-2.5-pro',
          displayName: 'Gemini 2.5 Pro',
          supportedGenerationMethods: ['generateContent'],
        },
        {
          name: 'models/text-embedding-004',
          supportedGenerationMethods: ['embedContent'],
        },
        {
          name: 'models/aqa',
          supportedGenerationMethods: ['generateContent'],
        },
      ],
    });
    expect(models).toEqual([
      { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
    ]);
  });

  it('answers an empty list for an unknown shape', () => {
    expect(parseExpenseAiModels('mistral', null)).toEqual([]);
    expect(parseExpenseAiModels('openai', { data: 'nope' })).toEqual([]);
    expect(parseExpenseAiModels('google', { models: [{ name: 7 }] })).toEqual(
      [],
    );
  });
});
