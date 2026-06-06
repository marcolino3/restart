import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';

import { AdmissionRejectionReasonsService } from './admission-rejection-reasons.service';
import { AdmissionRejectionReason } from './entities/admission-rejection-reason.entity';

const ORG_ID = 'org-1';
const OTHER_ORG = 'org-2';

const createQb = (max: number | null) => ({
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ max }),
});

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve(v)),
  createQueryBuilder: jest.fn(() => createQb(null)),
});

describe('AdmissionRejectionReasonsService', () => {
  let service: AdmissionRejectionReasonsService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionRejectionReasonsService,
        {
          provide: getRepositoryToken(AdmissionRejectionReason),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(AdmissionRejectionReasonsService);
  });

  describe('findAllByOrgId', () => {
    it('scopes to the org and excludes archived by default', async () => {
      await service.findAllByOrgId(ORG_ID);
      const args = repo.find.mock.calls[0][0];
      expect(args.where).toEqual({ organizationId: ORG_ID, isArchived: false });
      expect(args.order).toEqual({ position: 'ASC', createdAt: 'ASC' });
    });

    it('includes archived when requested', async () => {
      await service.findAllByOrgId(ORG_ID, true);
      const args = repo.find.mock.calls[0][0];
      expect(args.where).toEqual({ organizationId: ORG_ID });
    });
  });

  describe('findOne (multi-tenant isolation)', () => {
    it('throws when the reason belongs to another org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('r-1', ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      // The lookup is always scoped by organizationId.
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'r-1',
        organizationId: ORG_ID,
      });
    });
  });

  describe('create', () => {
    it('auto-assigns the next position and stamps the org', async () => {
      repo.createQueryBuilder.mockReturnValue(createQb(4));
      await service.create({ label: 'No spot' }, ORG_ID);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'No spot',
          position: 5,
          organizationId: ORG_ID,
        }),
      );
    });
  });

  describe('update', () => {
    it('loads the reason org-scoped before applying changes', async () => {
      repo.findOne.mockResolvedValue({
        id: 'r-1',
        label: 'Old',
        organizationId: ORG_ID,
      });
      const res = await service.update({ id: 'r-1', label: 'New' }, ORG_ID);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'r-1',
        organizationId: ORG_ID,
      });
      expect(res.label).toBe('New');
    });
  });

  describe('archive', () => {
    it('flags the reason as archived', async () => {
      const reason = { id: 'r-1', isArchived: false, organizationId: ORG_ID };
      repo.findOne.mockResolvedValue(reason);
      const ok = await service.archive('r-1', ORG_ID);
      expect(ok).toBe(true);
      expect(reason.isArchived).toBe(true);
    });
  });

  describe('reorder (multi-tenant isolation)', () => {
    it('rejects when an id is not owned by the org', async () => {
      // Only one of the two requested ids resolves under this org.
      repo.find.mockResolvedValue([{ id: 'r-1', organizationId: ORG_ID }]);
      await expect(
        service.reorder(['r-1', 'r-2'], ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        id: In(['r-1', 'r-2']),
        organizationId: ORG_ID,
      });
    });

    it('persists the new positions for owned reasons', async () => {
      const reasons = [
        { id: 'r-1', position: 0, organizationId: ORG_ID },
        { id: 'r-2', position: 1, organizationId: ORG_ID },
      ];
      repo.find.mockResolvedValueOnce(reasons).mockResolvedValueOnce([]);
      await service.reorder(['r-2', 'r-1'], ORG_ID);
      const saved = repo.save.mock.calls[0][0];
      expect(saved.find((r: { id: string }) => r.id === 'r-2').position).toBe(
        0,
      );
      expect(saved.find((r: { id: string }) => r.id === 'r-1').position).toBe(
        1,
      );
    });

    it('does not leak across orgs when reordering', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.reorder(['r-1'], OTHER_ORG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
