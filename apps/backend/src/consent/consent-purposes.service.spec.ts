import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ConsentPurposesService } from './consent-purposes.service';
import { ConsentPurpose } from './entities/consent-purpose.entity';
import { ConsentLegalBasis } from './enums/consent-legal-basis.enum';
import { ConsentSubjectType } from './enums/consent-subject-type.enum';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const createMockRepository = () => {
  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ max: 4 }),
  };
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn((v: Partial<ConsentPurpose>) => v),
    save: jest.fn((v: Partial<ConsentPurpose>) => Promise.resolve(v)),
    createQueryBuilder: jest.fn(() => qb),
    _qb: qb,
  };
};

describe('ConsentPurposesService', () => {
  let service: ConsentPurposesService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentPurposesService,
        { provide: getRepositoryToken(ConsentPurpose), useValue: repo },
      ],
    }).compile();

    service = module.get(ConsentPurposesService);
  });

  describe('findAllByOrgId', () => {
    it('scopes to the org and excludes archived by default', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAllByOrgId(ORG_A);
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_A, isArchived: false },
        order: { position: 'ASC', createdAt: 'ASC' },
      });
    });

    it('includes archived when requested', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAllByOrgId(ORG_A, true);
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_A },
        order: { position: 'ASC', createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the purpose is not in the org (multi-tenant)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('p1', ORG_B)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'p1', organizationId: ORG_B },
      });
    });
  });

  describe('create', () => {
    it('rejects a duplicate slug within the org', async () => {
      repo.exists.mockResolvedValue(true);
      await expect(
        service.create(
          {
            name: 'Foto',
            slug: 'photo',
            appliesTo: [ConsentSubjectType.STUDENT],
          },
          ORG_A,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('normalizes the slug, auto-assigns next position and defaults', async () => {
      repo.exists.mockResolvedValue(false);
      const result = await service.create(
        {
          name: 'Foto',
          slug: 'Photo-Use',
          appliesTo: [ConsentSubjectType.STUDENT],
        },
        ORG_A,
      );
      expect(result.slug).toBe('photo-use');
      expect(result.position).toBe(5); // max 4 + 1
      expect(result.legalBasis).toBe(ConsentLegalBasis.CONSENT);
      expect(result.requiresEvidence).toBe(false);
      expect(result.isMandatory).toBe(false);
      expect(result.organizationId).toBe(ORG_A);
    });
  });

  describe('reorder', () => {
    it('throws when an id does not belong to the org', async () => {
      repo.find.mockResolvedValue([{ id: 'a' }]); // only 1 of 2 found
      await expect(service.reorder(['a', 'b'], ORG_A)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.find).toHaveBeenCalledWith({
        where: { id: expect.anything(), organizationId: ORG_A },
      });
    });
  });
});
