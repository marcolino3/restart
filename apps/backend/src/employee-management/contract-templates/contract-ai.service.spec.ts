import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { Organization } from '@/organizations/entities/organization.entity';
import {
  CONTRACT_AI_DEFAULT_MODEL,
  CONTRACT_AI_SETTING_KEYS,
  ContractAiService,
} from './contract-ai.service';

const ORG_ID = 'org-1';

const okResponse = (content: string) =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ choices: [{ message: { content } }] }),
    text: () => Promise.resolve(''),
  }) as unknown as Response;

const errorResponse = (status: number, body = '') =>
  ({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  }) as unknown as Response;

describe('ContractAiService', () => {
  let service: ContractAiService;
  let settings: { getDecryptedValue: jest.Mock };
  let orgsRepo: { findOne: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    settings = { getDecryptedValue: jest.fn() };
    orgsRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: ORG_ID, name: 'Musterschule', country: 'CH' }),
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractAiService,
        { provide: OrganizationSettingsService, useValue: settings },
        { provide: getRepositoryToken(Organization), useValue: orgsRepo },
      ],
    }).compile();
    service = module.get(ContractAiService);
  });

  const configureKey = (model?: string) => {
    settings.getDecryptedValue.mockImplementation(
      (_org: string, key: string) => {
        if (key === CONTRACT_AI_SETTING_KEYS.apiKey)
          return Promise.resolve('sk-test');
        if (key === CONTRACT_AI_SETTING_KEYS.model)
          return Promise.resolve(model ?? null);
        return Promise.resolve(null);
      },
    );
  };

  const userMessage = (content: string) => [{ role: 'user' as const, content }];

  describe('isConfigured', () => {
    it('is false without a stored key', async () => {
      settings.getDecryptedValue.mockResolvedValue('  ');
      await expect(service.isConfigured(ORG_ID)).resolves.toBe(false);
      expect(settings.getDecryptedValue).toHaveBeenCalledWith(
        ORG_ID,
        CONTRACT_AI_SETTING_KEYS.apiKey,
      );
    });

    it('is true with a key', async () => {
      settings.getDecryptedValue.mockResolvedValue('sk-test');
      await expect(service.isConfigured(ORG_ID)).resolves.toBe(true);
    });
  });

  describe('chatDialog', () => {
    it('rejects an empty history without calling the provider', async () => {
      configureKey();
      await expect(
        service.chatDialog(ORG_ID, [], null, null),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an over-long history', async () => {
      configureKey();
      const messages = Array.from({ length: 41 }, () => ({
        role: 'user' as const,
        content: 'x',
      }));
      await expect(
        service.chatDialog(ORG_ID, messages, null, null),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails closed when no API key is configured', async () => {
      settings.getDecryptedValue.mockResolvedValue(null);
      await expect(
        service.chatDialog(ORG_ID, userMessage('Hallo'), null, null),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns a plain reply when the answer carries no draft', async () => {
      configureKey();
      fetchMock.mockResolvedValue(okResponse('  Welche Rolle? '));

      const result = await service.chatDialog(
        ORG_ID,
        userMessage('Neuer Vertrag'),
        null,
        null,
      );

      expect(result).toEqual({ reply: 'Welche Rolle?', html: null });
    });

    it('extracts and sanitizes the draft, keeps explanations as reply', async () => {
      configureKey();
      fetchMock.mockResolvedValue(
        okResponse(
          'Hier der Entwurf.\n<contract-draft>```html\n<p>Vertrag</p><script>alert(1)</script>\n```</contract-draft>\nSag Bescheid.',
        ),
      );

      const result = await service.chatDialog(
        ORG_ID,
        userMessage('Erstelle den Vertrag'),
        null,
        null,
      );

      expect(result.reply).toBe('Hier der Entwurf.\n\nSag Bescheid.');
      expect(result.html).toContain('<p>Vertrag</p>');
      expect(result.html).not.toContain('<script');
      expect(result.html).not.toContain('```');
    });

    it('sends system prompt, current editor html and the full history in order', async () => {
      configureKey('mistral-small-latest');
      fetchMock.mockResolvedValue(okResponse('ok'));

      await service.chatDialog(
        ORG_ID,
        [
          { role: 'user', content: 'Frage 1' },
          { role: 'assistant', content: 'Antwort 1' },
          { role: 'user', content: 'Frage 2' },
        ],
        '<p>Aktuell</p>',
        null,
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('api.mistral.ai');
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer sk-test',
      );
      const body = JSON.parse(init.body as string) as {
        model: string;
        messages: { role: string; content: string }[];
      };
      expect(body.model).toBe('mistral-small-latest');
      expect(body.messages.map((m) => m.role)).toEqual([
        'system',
        'system',
        'user',
        'assistant',
        'user',
      ]);
      expect(body.messages[0].content).toContain('VORLAGE');
      expect(body.messages[0].content).toContain('{{employeeFullName}}');
      expect(body.messages[0].content).toContain('Schweizer Arbeitsrecht');
      expect(body.messages[1].content).toContain('<p>Aktuell</p>');
      expect(body.messages[4].content).toBe('Frage 2');
    });

    it('falls back to the default model', async () => {
      configureKey();
      fetchMock.mockResolvedValue(okResponse('ok'));

      await service.chatDialog(ORG_ID, userMessage('Hallo'), null, null);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as { model: string };
      expect(body.model).toBe(CONTRACT_AI_DEFAULT_MODEL);
    });

    it('grounds contract mode on the contract facts and the org country', async () => {
      configureKey();
      orgsRepo.findOne.mockResolvedValue({
        id: ORG_ID,
        name: 'Musterschule',
        country: 'Deutschland',
      });
      fetchMock.mockResolvedValue(okResponse('ok'));
      const contract = {
        id: 'c-1',
        organizationId: ORG_ID,
        position: 'Lehrperson',
        startDate: '2026-08-01',
        employee: { firstName: 'Anna', lastName: 'Muster' },
      } as unknown as EmployeeContract;

      await service.chatDialog(ORG_ID, userMessage('Hallo'), null, contract);

      const body = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as { messages: { role: string; content: string }[] };
      const system = body.messages[0].content;
      expect(system).toContain('konkreten Arbeitsvertrag');
      expect(system).toContain('Lehrperson');
      expect(system).toContain('deutsches Arbeitsrecht');
      expect(system).not.toContain('VORLAGE');
      expect(orgsRepo.findOne).toHaveBeenCalledWith({ where: { id: ORG_ID } });
    });

    it('maps provider errors without forwarding the provider body', async () => {
      configureKey();
      fetchMock.mockResolvedValue(
        errorResponse(401, '{"message":"secret details"}'),
      );

      await expect(
        service.chatDialog(ORG_ID, userMessage('Hallo'), null, null),
      ).rejects.toMatchObject({
        constructor: BadGatewayException,
        message: expect.not.stringContaining('secret details'),
      });
    });

    it('reports a model that the subscription tier does not allow', async () => {
      configureKey('mistral-large-latest');
      fetchMock.mockResolvedValue(
        errorResponse(400, '{"type":"tier_not_allowed"}'),
      );

      await expect(
        service.chatDialog(ORG_ID, userMessage('Hallo'), null, null),
      ).rejects.toThrow(/mistral-large-latest/);
    });

    it('turns network failures into BadGateway', async () => {
      configureKey();
      fetchMock.mockRejectedValue(new Error('ECONNRESET'));

      await expect(
        service.chatDialog(ORG_ID, userMessage('Hallo'), null, null),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('rejects an empty provider answer', async () => {
      configureKey();
      fetchMock.mockResolvedValue(okResponse('   '));

      await expect(
        service.chatDialog(ORG_ID, userMessage('Hallo'), null, null),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });
});
