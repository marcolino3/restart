import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';

import { AdmissionAppointmentTypesService } from './admission-appointment-types.service';
import { AdmissionAppointmentType } from './entities/admission-appointment-type.entity';

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

describe('AdmissionAppointmentTypesService', () => {
  let service: AdmissionAppointmentTypesService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionAppointmentTypesService,
        {
          provide: getRepositoryToken(AdmissionAppointmentType),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(AdmissionAppointmentTypesService);
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
    it('throws when the type belongs to another org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('t-1', ORG_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 't-1',
        organizationId: ORG_ID,
      });
    });
  });

  describe('create', () => {
    it('auto-assigns the next position and stamps the org', async () => {
      repo.createQueryBuilder.mockReturnValue(createQb(4));
      await service.create({ label: 'Schnuppertag' }, ORG_ID);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Schnuppertag',
          position: 5,
          organizationId: ORG_ID,
        }),
      );
    });
  });

  describe('update', () => {
    it('loads the type org-scoped before applying changes', async () => {
      repo.findOne.mockResolvedValue({
        id: 't-1',
        label: 'Old',
        organizationId: ORG_ID,
      });
      const res = await service.update({ id: 't-1', label: 'New' }, ORG_ID);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 't-1',
        organizationId: ORG_ID,
      });
      expect(res.label).toBe('New');
    });
  });

  describe('archive', () => {
    it('flags the type as archived', async () => {
      const type = { id: 't-1', isArchived: false, organizationId: ORG_ID };
      repo.findOne.mockResolvedValue(type);
      const ok = await service.archive('t-1', ORG_ID);
      expect(ok).toBe(true);
      expect(type.isArchived).toBe(true);
    });
  });

  describe('reorder (multi-tenant isolation)', () => {
    it('rejects when an id is not owned by the org', async () => {
      repo.find.mockResolvedValue([{ id: 't-1', organizationId: ORG_ID }]);
      await expect(
        service.reorder(['t-1', 't-2'], ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        id: In(['t-1', 't-2']),
        organizationId: ORG_ID,
      });
    });

    it('persists the new positions for owned types', async () => {
      const types = [
        { id: 't-1', position: 0, organizationId: ORG_ID },
        { id: 't-2', position: 1, organizationId: ORG_ID },
      ];
      repo.find.mockResolvedValueOnce(types).mockResolvedValueOnce([]);
      await service.reorder(['t-2', 't-1'], ORG_ID);
      const saved = repo.save.mock.calls[0][0];
      expect(saved.find((t: { id: string }) => t.id === 't-2').position).toBe(
        0,
      );
      expect(saved.find((t: { id: string }) => t.id === 't-1').position).toBe(
        1,
      );
    });

    it('does not leak across orgs when reordering', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.reorder(['t-1'], OTHER_ORG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
