import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AdmissionBoardSettingsService } from './admission-board-settings.service';
import { AdmissionBoardSettings } from './entities/admission-board-settings.entity';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn((v: Partial<AdmissionBoardSettings>) => v),
  save: jest.fn((v: Partial<AdmissionBoardSettings>) => Promise.resolve(v)),
});

describe('AdmissionBoardSettingsService', () => {
  let service: AdmissionBoardSettingsService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionBoardSettingsService,
        {
          provide: getRepositoryToken(AdmissionBoardSettings),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(AdmissionBoardSettingsService);
  });

  describe('findForOrg', () => {
    it('returns the persisted row when one exists', async () => {
      const row = { organizationId: ORG_A, tableColumns: ['stage', 'family'] };
      repo.findOne.mockResolvedValue(row);

      const result = await service.findForOrg(ORG_A);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: ORG_A },
      });
      expect(result).toBe(row);
    });

    it('returns a transient default (not persisted) when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findForOrg(ORG_A);

      expect(result.organizationId).toBe(ORG_A);
      expect(result.tableColumns).toBeNull();
      // Must not write a row just for reading.
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('scopes the lookup to the requested organization (multi-tenant)', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.findForOrg(ORG_B);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: ORG_B },
      });
    });
  });

  describe('upsertTableColumns', () => {
    it('updates the existing row in place', async () => {
      const existing = { organizationId: ORG_A, tableColumns: ['stage'] };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.upsertTableColumns(
        ['stage', 'family', 'days'],
        ORG_A,
      );

      expect(result.tableColumns).toEqual(['stage', 'family', 'days']);
      expect(repo.save).toHaveBeenCalledWith(existing);
      // No new row created when one already exists.
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a new row scoped to the org when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.upsertTableColumns(['family'], ORG_B);

      expect(repo.create).toHaveBeenCalledWith({
        organizationId: ORG_B,
        tableColumns: ['family'],
      });
      expect(result.organizationId).toBe(ORG_B);
      expect(result.tableColumns).toEqual(['family']);
    });

    it('never updates another org by always filtering on organizationId', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.upsertTableColumns(['stage'], ORG_A);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: ORG_A },
      });
    });
  });
});
