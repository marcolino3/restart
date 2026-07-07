import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';

import { AdmissionSourcesService } from './admission-sources.service';
import { AdmissionSource } from './entities/admission-source.entity';

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
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve(v)),
  createQueryBuilder: jest.fn(() => createQb(null)),
});

describe('AdmissionSourcesService', () => {
  let service: AdmissionSourcesService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionSourcesService,
        {
          provide: getRepositoryToken(AdmissionSource),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(AdmissionSourcesService);
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
    it('throws when the source belongs to another org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('s-1', ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      // The lookup is always scoped by organizationId.
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 's-1',
        organizationId: ORG_ID,
      });
    });
  });

  describe('create', () => {
    it('auto-assigns the next position and stamps the org', async () => {
      repo.createQueryBuilder.mockReturnValue(createQb(4));
      await service.create({ name: 'Website' }, ORG_ID);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Website',
          position: 5,
          organizationId: ORG_ID,
        }),
      );
    });
  });

  describe('update', () => {
    it('loads the source org-scoped before applying changes', async () => {
      repo.findOne.mockResolvedValue({
        id: 's-1',
        name: 'Old',
        organizationId: ORG_ID,
      });
      const res = await service.update({ id: 's-1', name: 'New' }, ORG_ID);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 's-1',
        organizationId: ORG_ID,
      });
      expect(res.name).toBe('New');
    });
  });

  describe('archive', () => {
    it('flags the source as archived', async () => {
      const source = { id: 's-1', isArchived: false, organizationId: ORG_ID };
      repo.findOne.mockResolvedValue(source);
      const ok = await service.archive('s-1', ORG_ID);
      expect(ok).toBe(true);
      expect(source.isArchived).toBe(true);
    });
  });

  describe('reorder (multi-tenant isolation)', () => {
    it('rejects when an id is not owned by the org', async () => {
      // Only one of the two requested ids resolves under this org.
      repo.find.mockResolvedValue([{ id: 's-1', organizationId: ORG_ID }]);
      await expect(
        service.reorder(['s-1', 's-2'], ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        id: In(['s-1', 's-2']),
        organizationId: ORG_ID,
      });
    });

    it('persists the new positions for owned sources', async () => {
      const sources = [
        { id: 's-1', position: 0, organizationId: ORG_ID },
        { id: 's-2', position: 1, organizationId: ORG_ID },
      ];
      repo.find.mockResolvedValueOnce(sources).mockResolvedValueOnce([]);
      await service.reorder(['s-2', 's-1'], ORG_ID);
      const saved = repo.save.mock.calls[0][0];
      expect(saved.find((s: { id: string }) => s.id === 's-2').position).toBe(
        0,
      );
      expect(saved.find((s: { id: string }) => s.id === 's-1').position).toBe(
        1,
      );
    });

    it('does not leak across orgs when reordering', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.reorder(['s-1'], OTHER_ORG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('seedDefaults', () => {
    it('creates the five default sources for a fresh org', async () => {
      repo.count.mockResolvedValue(0);
      await service.seedDefaults(ORG_ID);
      expect(repo.count).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
      expect(repo.create).toHaveBeenCalledTimes(5);
      const created = repo.create.mock.calls.map(
        (call: [Record<string, unknown>]) => call[0],
      );
      expect(created.map((s) => s.systemKey)).toEqual([
        'MANUAL',
        'PUBLIC_FORM',
        'OPEN_DAY',
        'REFERRAL',
        'OTHER',
      ]);
      expect(
        created.every((s) => s.organizationId === ORG_ID && s.color === null),
      ).toBe(true);
    });

    it('does nothing when the org already has sources', async () => {
      repo.count.mockResolvedValue(3);
      const res = await service.seedDefaults(ORG_ID);
      expect(res).toEqual([]);
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('uses the provided EntityManager when given', async () => {
      const txRepo = createMockRepository();
      const manager = {
        getRepository: jest.fn().mockReturnValue(txRepo),
      };
      await service.seedDefaults(ORG_ID, manager as never);
      expect(manager.getRepository).toHaveBeenCalledWith(AdmissionSource);
      expect(txRepo.create).toHaveBeenCalledTimes(5);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});
