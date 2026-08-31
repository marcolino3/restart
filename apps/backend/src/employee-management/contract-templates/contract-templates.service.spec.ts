import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ContractTemplatesService } from './contract-templates.service';
import { ContractTemplate } from './entities/contract-template.entity';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((x) => x),
  save: jest.fn((x) => Promise.resolve({ id: 'tpl-1', ...x })),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('ContractTemplatesService', () => {
  let service: ContractTemplatesService;
  let repo: ReturnType<typeof createMockRepository>;
  let contractsRepo: ReturnType<typeof createMockRepository>;
  let orgsRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    contractsRepo = createMockRepository();
    orgsRepo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractTemplatesService,
        { provide: getRepositoryToken(ContractTemplate), useValue: repo },
        {
          provide: getRepositoryToken(EmployeeContract),
          useValue: contractsRepo,
        },
        { provide: getRepositoryToken(Organization), useValue: orgsRepo },
      ],
    }).compile();
    service = module.get(ContractTemplatesService);
  });

  describe('findForOrg', () => {
    it('always scopes to the active organization', async () => {
      await service.findForOrg(ORG_ID);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        organizationId: ORG_ID,
      });
    });
  });

  describe('findOneForOrg', () => {
    it('rejects a template of a foreign organization', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.findOneForOrg('tpl-1', OTHER_ORG_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'tpl-1',
        organizationId: OTHER_ORG_ID,
      });
    });
  });

  describe('create', () => {
    it('sanitizes HTML fields before saving', async () => {
      const saved = await service.create(
        {
          name: ' Arbeitsvertrag ',
          bodyHtml: '<p>Hallo</p><script>alert(1)</script>',
          headerHtml: '<div>Kopf<img src=x onerror=alert(1)></div>',
          footerHtml: '<p onclick="x()">Fuss</p>',
        },
        ORG_ID,
        'mem-1',
      );
      expect(saved.name).toBe('Arbeitsvertrag');
      expect(saved.bodyHtml).not.toContain('<script>');
      expect(saved.headerHtml).not.toContain('onerror');
      expect(saved.footerHtml).not.toContain('onclick');
      expect(saved.organizationId).toBe(ORG_ID);
      expect(saved.showLogo).toBe(true);
    });
  });

  describe('update', () => {
    it('refuses to update templates of a foreign organization', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.update({ id: 'tpl-1', name: 'X' }, OTHER_ORG_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('verifies ownership before deleting', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('tpl-1', OTHER_ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('deletes org-scoped', async () => {
      repo.findOne.mockResolvedValue({ id: 'tpl-1', organizationId: ORG_ID });
      await service.remove('tpl-1', ORG_ID);
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'tpl-1',
        organizationId: ORG_ID,
      });
    });
  });

  describe('preview', () => {
    it('resolves placeholders from the org-scoped contract', async () => {
      repo.findOne.mockResolvedValue({
        id: 'tpl-1',
        organizationId: ORG_ID,
        bodyHtml: '<p>Vertrag für {{employeeFullName}} ab {{startDate}}</p>',
        headerHtml: '<div>{{orgName}}</div>',
        footerHtml: null,
        showLogo: true,
      });
      contractsRepo.findOne.mockResolvedValue({
        id: 'c-1',
        organizationId: ORG_ID,
        startDate: '2026-09-01',
        employee: {
          membership: { user: { firstName: 'Anna', lastName: 'Muster' } },
        },
      });
      orgsRepo.findOne.mockResolvedValue({ id: ORG_ID, name: 'Schule X' });

      const preview = await service.preview('c-1', 'tpl-1', ORG_ID);
      expect(preview.bodyHtml).toBe(
        '<p>Vertrag für Anna Muster ab 01.09.2026</p>',
      );
      expect(preview.headerHtml).toBe('<div>Schule X</div>');
      expect(preview.footerHtml).toBeNull();
    });

    it('rejects a contract of a foreign organization', async () => {
      repo.findOne.mockResolvedValue({
        id: 'tpl-1',
        organizationId: ORG_ID,
        bodyHtml: '<p></p>',
      });
      contractsRepo.findOne.mockResolvedValue(null);
      await expect(service.preview('c-1', 'tpl-1', ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(contractsRepo.findOne.mock.calls[0][0].where).toEqual({
        id: 'c-1',
        organizationId: ORG_ID,
      });
    });
  });
});
