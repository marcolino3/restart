import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { ClassBudgetAccessService } from './class-budget-access.service';
import { ExpenseCategory } from './entities/expense-category.entity';
import { ExpenseReceiptAiService } from './expense-receipt-ai.service';
import { ExpenseReceiptsService } from './expense-receipts.service';

const ORG = '11111111-1111-4111-8111-111111111111';
const CLASS = '22222222-2222-4222-8222-222222222222';
const FILE = '33333333-3333-4333-8333-333333333333.pdf';

describe('ExpenseReceiptAiService', () => {
  let service: ExpenseReceiptAiService;
  let settings: Record<string, string>;
  let getDecryptedValue: jest.Mock;
  let assertCanManageSettings: jest.Mock;
  let categoriesRepo: { find: jest.Mock };
  let receipts: { read: jest.Mock; mimeOf: jest.Mock };
  let access: { assertSchoolClassAccessible: jest.Mock };
  let fetchMock: jest.Mock;
  const realFetch = global.fetch;

  const user: TokenPayload = { sub: 'user-1', orgId: ORG, roles: ['EMPLOYEE'] };

  const answer = (
    content: unknown,
    status = 200,
    headers: Record<string, string> = {},
  ) =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      json: () => Promise.resolve(content),
    } as Response);
  const mistralAnswer = (payload: object) =>
    answer({ choices: [{ message: { content: JSON.stringify(payload) } }] });

  beforeEach(() => {
    settings = { CONTRACT_AI_MISTRAL_API_KEY: 'mistral-key' };
    getDecryptedValue = jest.fn((orgId: string, key: string) =>
      Promise.resolve(orgId === ORG ? (settings[key] ?? null) : null),
    );
    assertCanManageSettings = jest.fn().mockResolvedValue(undefined);
    categoriesRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'cat-1', name: 'Material' }]),
    };
    receipts = {
      read: jest.fn().mockResolvedValue(Buffer.from('%PDF')),
      mimeOf: jest.fn().mockReturnValue('application/pdf'),
    };
    access = {
      assertSchoolClassAccessible: jest.fn().mockResolvedValue(undefined),
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    service = new ExpenseReceiptAiService(
      {
        getDecryptedValue,
        assertCanManageSettings,
      } as unknown as OrganizationSettingsService,
      categoriesRepo as unknown as Repository<ExpenseCategory>,
      receipts as unknown as ExpenseReceiptsService,
      access as unknown as ClassBudgetAccessService,
    );
    service.retryFallbackMs = 0;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('defaults to the contract Mistral key and the contract model', async () => {
    fetchMock.mockReturnValue(
      mistralAnswer({
        vendor: 'Migros',
        amount: 12.5,
        categoryName: 'Material',
      }),
    );

    const result = await service.analyze(CLASS, FILE, ORG, user);

    expect(result).toMatchObject({
      vendor: 'Migros',
      amount: 12.5,
      suggestedCategoryId: 'cat-1',
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mistral.ai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer mistral-key',
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'mistral-large-latest',
    });
  });

  it('follows the stored contract model until a receipt model is picked', async () => {
    settings.CONTRACT_AI_MODEL = 'mistral-medium-latest';
    fetchMock.mockReturnValue(mistralAnswer({ vendor: 'Migros' }));

    await service.analyze(CLASS, FILE, ORG, user);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'mistral-medium-latest',
    });
  });

  it('uses the model picked for the contract key', async () => {
    settings.CONTRACT_AI_MODEL = 'mistral-medium-latest';
    settings.EXPENSE_AI_MODEL = 'mistral-large-latest';
    fetchMock.mockReturnValue(mistralAnswer({ vendor: 'Migros' }));

    await service.analyze(CLASS, FILE, ORG, user);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer mistral-key',
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'mistral-large-latest',
    });
  });

  describe('listModels', () => {
    const modelList = () =>
      answer({
        data: [{ id: 'mistral-large-latest', capabilities: { vision: true } }],
      });

    it('is refused for a user who may not manage the org settings', async () => {
      assertCanManageSettings.mockRejectedValue(new ForbiddenException());

      await expect(
        service.listModels(ORG, user, 'contracts'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(assertCanManageSettings).toHaveBeenCalledWith(ORG, user);
      expect(getDecryptedValue).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an unknown provider without calling anyone', async () => {
      await expect(
        service.listModels(ORG, user, 'https://evil.example'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('lists the models of the contract key', async () => {
      fetchMock.mockReturnValue(modelList());

      const result = await service.listModels(ORG, user, 'contracts');

      expect(result).toEqual({
        models: [{ id: 'mistral-large-latest', displayName: null }],
        errorCode: null,
      });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.mistral.ai/v1/models');
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer mistral-key',
      );
    });

    it('never sends the stored key to another vendor', async () => {
      settings.EXPENSE_AI_PROVIDER = 'openai';
      settings.EXPENSE_AI_API_KEY = 'openai-key';

      const result = await service.listModels(ORG, user, 'anthropic');

      expect(result).toEqual({
        models: [],
        errorCode: 'EXPENSE_AI_NOT_CONFIGURED',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reads the key of the given organization only', async () => {
      const result = await service.listModels('other-org', user, 'contracts');

      expect(result.errorCode).toBe('EXPENSE_AI_NOT_CONFIGURED');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reports a rejected key and an unreachable provider as codes', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      fetchMock.mockReturnValueOnce(answer({}, 401));
      expect((await service.listModels(ORG, user, 'contracts')).errorCode).toBe(
        'EXPENSE_AI_KEY_REJECTED',
      );

      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
      expect((await service.listModels(ORG, user, 'contracts')).errorCode).toBe(
        'EXPENSE_AI_UNREACHABLE',
      );
    });
  });

  it('uses the opted-in provider with its own key and model', async () => {
    settings.EXPENSE_AI_PROVIDER = 'anthropic';
    settings.EXPENSE_AI_API_KEY = 'anthropic-key';
    settings.EXPENSE_AI_MODEL = 'claude-custom';
    fetchMock.mockReturnValue(
      answer({ content: [{ type: 'text', text: '{"vendor":"Coop"}' }] }),
    );

    await expect(
      service.analyze(CLASS, FILE, ORG, user),
    ).resolves.toMatchObject({ vendor: 'Coop' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe(
      'anthropic-key',
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'claude-custom',
    });
  });

  it('does not fall back to the contract key for an opted-in provider', async () => {
    settings.EXPENSE_AI_PROVIDER = 'openai';

    await expect(service.isConfigured(ORG)).resolves.toBe(false);
    await expect(
      service.analyze(CLASS, FILE, ORG, user),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats an unknown stored provider as the default', async () => {
    settings.EXPENSE_AI_PROVIDER = 'something-else';
    await expect(service.isConfigured(ORG)).resolves.toBe(true);
  });

  it('reads settings of the given organization only', async () => {
    await expect(
      service.isConfigured('99999999-9999-4999-8999-999999999999'),
    ).resolves.toBe(false);
  });

  it('checks class access before anything is read or sent', async () => {
    access.assertSchoolClassAccessible.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      service.analyze(CLASS, FILE, ORG, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(access.assertSchoolClassAccessible).toHaveBeenCalledWith(
      CLASS,
      ORG,
      user,
    );
    expect(receipts.read).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads the receipt under the session org and class', async () => {
    fetchMock.mockReturnValue(mistralAnswer({ vendor: 'x' }));
    await service.analyze(CLASS, FILE, ORG, user);

    expect(receipts.read).toHaveBeenCalledWith(ORG, CLASS, FILE);
    expect(categoriesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG, isArchived: false },
      }),
    );
  });

  it('maps a missing receipt to NotFound without calling the provider', async () => {
    receipts.read.mockRejectedValue(new Error('ENOENT'));
    await expect(
      service.analyze(CLASS, FILE, ORG, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the file and category names, but no ids of the org', async () => {
    fetchMock.mockReturnValue(mistralAnswer({ vendor: 'x' }));
    await service.analyze(CLASS, FILE, ORG, user);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as string;
    expect(body).toContain('Material');
    expect(body).toContain(Buffer.from('%PDF').toString('base64'));
    for (const secret of ['cat-1', ORG, CLASS, FILE, 'user-1']) {
      expect(body).not.toContain(secret);
    }
  });

  it.each([
    ['provider error', () => answer({ error: 'boom' }, 500)],
    ['rejected key', () => answer({}, 401)],
    ['network failure', () => Promise.reject(new Error('ECONNRESET'))],
    ['empty answer', () => answer({ choices: [] })],
    [
      'answer that is not JSON',
      () => answer({ choices: [{ message: { content: 'no idea' } }] }),
    ],
  ])('turns a %s into BadGateway', async (_label, respond) => {
    fetchMock.mockImplementation(respond);
    await expect(
      service.analyze(CLASS, FILE, ORG, user),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it.each([
    ['a rejected key', () => answer({}, 401), 'EXPENSE_AI_KEY_REJECTED'],
    [
      'a used-up quota',
      () => answer({ error: { type: 'insufficient_quota' } }, 429),
      'EXPENSE_AI_QUOTA_EXCEEDED',
    ],
    [
      'a model without capacity on the tier',
      () =>
        answer(
          { message: 'Service tier capacity exceeded for this model.' },
          429,
        ),
      'EXPENSE_AI_CAPACITY',
    ],
    [
      'a document the provider refuses',
      () => answer({ message: 'invalid document' }, 422),
      'EXPENSE_AI_FILE_REJECTED',
    ],
    [
      'a network failure',
      () => Promise.reject(new Error('ECONNRESET')),
      'EXPENSE_AI_UNREACHABLE',
    ],
    [
      'a timeout',
      () =>
        Promise.reject(
          Object.assign(new Error('timed out'), { name: 'TimeoutError' }),
        ),
      'EXPENSE_AI_TIMEOUT',
    ],
    [
      'an empty answer',
      () => answer({ choices: [] }),
      'EXPENSE_AI_UNUSABLE_ANSWER',
    ],
  ])('reports %s as a stable code', async (_label, respond, code) => {
    fetchMock.mockImplementation(respond);
    await expect(service.analyze(CLASS, FILE, ORG, user)).rejects.toThrow(code);
  });

  it('retries a plain rate limit once and then succeeds', async () => {
    fetchMock
      .mockReturnValueOnce(
        answer({ message: 'Requests rate limit exceeded' }, 429, {
          'retry-after': '0',
        }),
      )
      .mockReturnValueOnce(mistralAnswer({ vendor: 'Migros' }));

    const suggestion = await service.analyze(CLASS, FILE, ORG, user);

    expect(suggestion.vendor).toBe('Migros');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after one retry and does not retry quota or capacity', async () => {
    fetchMock.mockImplementation(() =>
      answer({ message: 'Requests rate limit exceeded' }, 429),
    );
    await expect(service.analyze(CLASS, FILE, ORG, user)).rejects.toThrow(
      'EXPENSE_AI_RATE_LIMITED',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockClear();
    fetchMock.mockImplementation(() =>
      answer({ error: { code: 'insufficient_quota' } }, 429),
    );
    await expect(service.analyze(CLASS, FILE, ORG, user)).rejects.toThrow(
      'EXPENSE_AI_QUOTA_EXCEEDED',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a key without any allowance and does not retry it', async () => {
    fetchMock.mockImplementation(() =>
      answer({ type: 'rate_limited', message: 'Rate limit exceeded' }, 429, {
        'x-ratelimit-limit-req-minute': '0',
        'x-ratelimit-remaining-req-minute': '0',
      }),
    );

    await expect(service.analyze(CLASS, FILE, ORG, user)).rejects.toThrow(
      'EXPENSE_AI_NO_ALLOWANCE',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never logs the provider message of a rejected document', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    fetchMock.mockImplementation(() =>
      answer({ message: 'IBAN CH93 0076 2011 6238 5295 7 unreadable' }, 422),
    );

    await expect(service.analyze(CLASS, FILE, ORG, user)).rejects.toThrow(
      'EXPENSE_AI_FILE_REJECTED',
    );

    expect(JSON.stringify(warn.mock.calls)).not.toContain('IBAN');
    warn.mockRestore();
  });
});
