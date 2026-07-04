import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EmailTemplatesService } from './email-templates.service';
import { AdmissionEmail } from './entities/admission-email.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailTemplateCategory } from './enums/email-template-category.enum';

const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((x) => x),
  save: jest.fn((x) => Promise.resolve({ id: 'tpl-1', ...x })),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});

// The AdmissionEmail repo mock only needs a chainable query builder whose
// getRawMany result the test controls (for sentCount aggregation).
const createMockEmailsRepo = () => {
  const getRawMany = jest.fn().mockResolvedValue([]);
  const qb = {
    select: () => qb,
    addSelect: () => qb,
    where: () => qb,
    andWhere: () => qb,
    groupBy: () => qb,
    getRawMany,
  };
  return { createQueryBuilder: jest.fn(() => qb), getRawMany };
};

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;
  let repo: ReturnType<typeof createMockRepository>;
  let emailsRepo: ReturnType<typeof createMockEmailsRepo>;

  beforeEach(async () => {
    repo = createMockRepository();
    emailsRepo = createMockEmailsRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplatesService,
        { provide: getRepositoryToken(EmailTemplate), useValue: repo },
        { provide: getRepositoryToken(AdmissionEmail), useValue: emailsRepo },
      ],
    }).compile();
    service = module.get(EmailTemplatesService);
  });

  describe('findForOrg', () => {
    it('always scopes to the active organization', async () => {
      await service.findForOrg(ORG_ID);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        organizationId: ORG_ID,
      });
    });

    it('adds a category filter when provided', async () => {
      await service.findForOrg(ORG_ID, EmailTemplateCategory.ADMISSION);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        organizationId: ORG_ID,
        category: EmailTemplateCategory.ADMISSION,
      });
    });
  });

  describe('create', () => {
    it('sanitizes the body html and persists with org + creator', async () => {
      await service.create(
        {
          name: 'Welcome',
          subject: 'Hi',
          bodyHtml: '<p>Hi</p><script>alert(1)</script>',
        },
        ORG_ID,
        'membership-1',
      );
      const created = repo.create.mock.calls[0][0];
      expect(created.organizationId).toBe(ORG_ID);
      expect(created.createdByMembershipId).toBe('membership-1');
      // <script> must be stripped by the sanitizer.
      expect(created.bodyHtml).not.toContain('<script>');
      expect(created.bodyHtml).toContain('<p>Hi</p>');
    });
  });

  describe('multi-tenant isolation', () => {
    it('findOneForOrg throws when the template belongs to another org', async () => {
      // Repo returns nothing because the WHERE includes the foreign org id.
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.findOneForOrg('tpl-1', OTHER_ORG_ID),
      ).rejects.toThrow(NotFoundException);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'tpl-1',
        organizationId: OTHER_ORG_ID,
      });
    });

    it('remove refuses to delete a foreign-org template', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('tpl-1', OTHER_ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('update only persists after verifying org ownership', async () => {
      repo.findOne.mockResolvedValue({
        id: 'tpl-1',
        organizationId: ORG_ID,
        name: 'Old',
        subject: 'Old',
        bodyHtml: '<p>Old</p>',
      });
      await service.update({ id: 'tpl-1', name: 'New' }, ORG_ID);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'tpl-1',
        organizationId: ORG_ID,
      });
      expect(repo.save.mock.calls[0][0].name).toBe('New');
    });
  });

  describe('isAutomatic + sentCount', () => {
    it('create persists the isAutomatic flag', async () => {
      await service.create(
        {
          name: 'Confirmation',
          subject: 'Hi',
          bodyHtml: '<p>Hi</p>',
          isAutomatic: true,
        },
        ORG_ID,
        'membership-1',
      );
      expect(repo.create.mock.calls[0][0].isAutomatic).toBe(true);
    });

    it('create defaults isAutomatic to false when omitted', async () => {
      await service.create(
        { name: 'Manual', subject: 'Hi', bodyHtml: '<p>Hi</p>' },
        ORG_ID,
        'membership-1',
      );
      expect(repo.create.mock.calls[0][0].isAutomatic).toBe(false);
    });

    it('update persists a changed isAutomatic flag', async () => {
      repo.findOne.mockResolvedValue({
        id: 'tpl-1',
        organizationId: ORG_ID,
        isAutomatic: false,
      });
      await service.update({ id: 'tpl-1', isAutomatic: true }, ORG_ID);
      expect(repo.save.mock.calls[0][0].isAutomatic).toBe(true);
    });

    it('findForOrg populates sentCount from sent admission emails (org-scoped)', async () => {
      repo.find.mockResolvedValue([
        { id: 'tpl-1', organizationId: ORG_ID, sentCount: 0 },
        { id: 'tpl-2', organizationId: ORG_ID, sentCount: 0 },
      ]);
      emailsRepo.getRawMany.mockResolvedValue([
        { templateId: 'tpl-1', count: 3 },
      ]);

      const result = await service.findForOrg(ORG_ID);

      expect(result.find((t) => t.id === 'tpl-1')?.sentCount).toBe(3);
      // No sent emails → stays 0.
      expect(result.find((t) => t.id === 'tpl-2')?.sentCount).toBe(0);
    });
  });
});
