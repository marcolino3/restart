import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DataSubjectRequestsService } from './data-subject-requests.service';
import { DataSubjectRequest } from './entities/data-subject-request.entity';
import { DataSubjectRequestStatus } from './enums/data-subject-request-status.enum';
import { DataSubjectRequestType } from './enums/data-subject-request-type.enum';
import { DataSubjectType } from './enums/data-subject-type.enum';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((v: Partial<DataSubjectRequest>) => v),
  save: jest.fn((v: Partial<DataSubjectRequest>) => Promise.resolve(v)),
});

const daysBetween = (a: Date, b: Date) =>
  Math.round((a.getTime() - b.getTime()) / 86_400_000);

describe('DataSubjectRequestsService', () => {
  let service: DataSubjectRequestsService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSubjectRequestsService,
        { provide: getRepositoryToken(DataSubjectRequest), useValue: repo },
      ],
    }).compile();

    service = module.get(DataSubjectRequestsService);
  });

  describe('findAllByOrgId', () => {
    it('scopes to the org and applies the optional status filter', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAllByOrgId(ORG_A, DataSubjectRequestStatus.NEW);
      expect(repo.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_A, status: DataSubjectRequestStatus.NEW },
        relations: { assigneeMembership: { user: true } },
        order: { dueDate: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the request is not in the org (multi-tenant)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('r1', ORG_B)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'r1', organizationId: ORG_B },
        relations: { assigneeMembership: { user: true } },
      });
    });
  });

  describe('create', () => {
    it('computes the deadline (received + 30 days) and defaults', async () => {
      const receivedAt = new Date('2026-01-01T00:00:00.000Z');
      const result = await service.create(
        {
          type: DataSubjectRequestType.ACCESS,
          subjectName: 'Jane Doe',
          receivedAt,
        },
        ORG_A,
        'actor-1',
      );

      expect(daysBetween(result.dueDate, receivedAt)).toBe(30);
      expect(result.status).toBe(DataSubjectRequestStatus.NEW);
      expect(result.subjectType).toBe(DataSubjectType.OTHER);
      expect(result.createdByMembershipId).toBe('actor-1');
      expect(result.organizationId).toBe(ORG_A);
    });
  });

  describe('update', () => {
    it('stamps resolvedAt when moving to a terminal status', async () => {
      repo.findOne.mockResolvedValue({
        id: 'r1',
        status: DataSubjectRequestStatus.IN_PROGRESS,
        resolvedAt: null,
        organizationId: ORG_A,
      });

      const result = await service.update(
        { id: 'r1', status: DataSubjectRequestStatus.COMPLETED },
        ORG_A,
      );

      expect(result.status).toBe(DataSubjectRequestStatus.COMPLETED);
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('clears resolvedAt when re-opening', async () => {
      repo.findOne.mockResolvedValue({
        id: 'r1',
        status: DataSubjectRequestStatus.COMPLETED,
        resolvedAt: new Date(),
        organizationId: ORG_A,
      });

      const result = await service.update(
        { id: 'r1', status: DataSubjectRequestStatus.IN_PROGRESS },
        ORG_A,
      );

      expect(result.resolvedAt).toBeNull();
    });

    it('recomputes the deadline when receivedAt changes', async () => {
      repo.findOne.mockResolvedValue({
        id: 'r1',
        status: DataSubjectRequestStatus.NEW,
        organizationId: ORG_A,
      });
      const receivedAt = new Date('2026-06-01T00:00:00.000Z');

      const result = await service.update({ id: 'r1', receivedAt }, ORG_A);

      expect(daysBetween(result.dueDate, receivedAt)).toBe(30);
    });
  });
});
