import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { ContractAiService } from './contract-ai.service';
import { ContractTemplatesResolver } from './contract-templates.resolver';
import { ContractTemplatesService } from './contract-templates.service';

const methodOf = (name: keyof ContractTemplatesResolver): object =>
  Object.getOwnPropertyDescriptor(ContractTemplatesResolver.prototype, name)
    ?.value as object;

describe('ContractTemplatesResolver', () => {
  let resolver: ContractTemplatesResolver;
  let templates: { loadContractForOrg: jest.Mock };
  let ai: { isConfigured: jest.Mock; chatDialog: jest.Mock };

  beforeEach(async () => {
    templates = { loadContractForOrg: jest.fn() };
    ai = { isConfigured: jest.fn(), chatDialog: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractTemplatesResolver,
        { provide: ContractTemplatesService, useValue: templates },
        { provide: ContractAiService, useValue: ai },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(ContractTemplatesResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', ContractTemplatesResolver) ?? [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it.each([
    ['contractAiConfigured', 'EMPLOYEE_READ'],
    ['contractAiChat', 'EMPLOYEE_WRITE'],
    ['findAll', 'EMPLOYEE_READ'],
    ['preview', 'EMPLOYEE_WRITE'],
    ['createContractTemplate', 'EMPLOYEE_WRITE'],
    ['updateContractTemplate', 'EMPLOYEE_WRITE'],
    ['deleteContractTemplate', 'EMPLOYEE_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  describe('contractAiChat', () => {
    const messages = [{ role: 'user' as const, content: 'Hallo' }];

    it('runs template mode without touching contracts', async () => {
      ai.chatDialog.mockResolvedValue({ reply: 'Frage?', html: null });

      const result = await resolver.contractAiChat({ messages }, 'org-a');

      expect(result).toEqual({ reply: 'Frage?', html: null });
      expect(templates.loadContractForOrg).not.toHaveBeenCalled();
      expect(ai.chatDialog).toHaveBeenCalledWith('org-a', messages, null, null);
    });

    it('loads the contract org-scoped before calling the AI', async () => {
      const contract = { id: 'c-1', organizationId: 'org-a' };
      templates.loadContractForOrg.mockResolvedValue(contract);
      ai.chatDialog.mockResolvedValue({ reply: '', html: '<p>x</p>' });

      await resolver.contractAiChat(
        { messages, currentHtml: '<p>alt</p>', contractId: 'c-1' },
        'org-a',
      );

      expect(templates.loadContractForOrg).toHaveBeenCalledWith('c-1', 'org-a');
      expect(ai.chatDialog).toHaveBeenCalledWith(
        'org-a',
        messages,
        '<p>alt</p>',
        contract,
      );
    });

    it('refuses a foreign-org contract without any AI call (multi-tenant isolation)', async () => {
      templates.loadContractForOrg.mockRejectedValue(
        new NotFoundException('Contract not found'),
      );

      await expect(
        resolver.contractAiChat({ messages, contractId: 'c-foreign' }, 'org-a'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(ai.chatDialog).not.toHaveBeenCalled();
    });
  });
});
