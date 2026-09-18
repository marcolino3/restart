import {
  classifyProviderError,
  EXPENSE_AI_ERRORS,
  readProviderError,
  retryDelayMs,
} from './expense-ai-errors';

describe('readProviderError', () => {
  it('reads the flat Mistral shape', () => {
    expect(
      readProviderError({
        object: 'error',
        message: 'Service tier capacity exceeded for this model.',
        type: 'invalid_request_error',
        code: '3505',
      }),
    ).toEqual({
      code: '3505/invalid_request_error',
      message: 'Service tier capacity exceeded for this model.',
    });
  });

  it('reads the nested shape of OpenAI, Anthropic and Google', () => {
    expect(
      readProviderError({
        error: {
          type: 'insufficient_quota',
          message: 'You exceeded your quota',
        },
      }),
    ).toEqual({
      code: 'insufficient_quota',
      message: 'You exceeded your quota',
    });
    expect(
      readProviderError({
        error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'quota' },
      }).code,
    ).toBe('429/RESOURCE_EXHAUSTED');
  });

  it('keeps log lines short, single-line and free of objects', () => {
    const info = readProviderError({
      message: `line one\nline two\t${'x'.repeat(500)}`,
      code: { nested: 'object' },
    });
    expect(info.message).toHaveLength(200);
    expect(info.message.startsWith('line one line two x')).toBe(true);
    expect(info.code).toBe('');
    expect(readProviderError('<html>502</html>')).toEqual({
      code: '',
      message: '',
    });
  });
});

describe('classifyProviderError', () => {
  const none = { code: '', message: '' };

  it('tells the three meanings of a 429 apart', () => {
    expect(
      classifyProviderError(429, {
        code: '',
        message: 'Requests rate limit exceeded',
      }),
    ).toBe(EXPENSE_AI_ERRORS.rateLimited);
    expect(
      classifyProviderError(429, {
        code: '3505',
        message: 'Service tier capacity exceeded for this model.',
      }),
    ).toBe(EXPENSE_AI_ERRORS.capacity);
    expect(
      classifyProviderError(429, { code: 'insufficient_quota', message: '' }),
    ).toBe(EXPENSE_AI_ERRORS.quotaExceeded);
  });

  it('maps the remaining statuses', () => {
    expect(classifyProviderError(401, none)).toBe(
      EXPENSE_AI_ERRORS.keyRejected,
    );
    expect(classifyProviderError(403, none)).toBe(
      EXPENSE_AI_ERRORS.keyRejected,
    );
    expect(classifyProviderError(402, none)).toBe(
      EXPENSE_AI_ERRORS.quotaExceeded,
    );
    expect(classifyProviderError(503, none)).toBe(EXPENSE_AI_ERRORS.capacity);
    expect(classifyProviderError(422, none)).toBe(
      EXPENSE_AI_ERRORS.fileRejected,
    );
    expect(classifyProviderError(500, none)).toBe(EXPENSE_AI_ERRORS.failed);
  });
});

describe('retryDelayMs', () => {
  it('honours Retry-After up to the cap and falls back otherwise', () => {
    expect(retryDelayMs('1', 2000, 5000)).toBe(1000);
    expect(retryDelayMs('120', 2000, 5000)).toBe(5000);
    expect(retryDelayMs(null, 2000, 5000)).toBe(2000);
    expect(retryDelayMs('Wed, 21 Oct 2026 07:28:00 GMT', 2000, 5000)).toBe(
      2000,
    );
  });
});
