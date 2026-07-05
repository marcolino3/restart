import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DataBreachesService } from './data-breaches.service';
import { DataBreachIncident } from './entities/data-breach-incident.entity';
import { DataBreachStatus } from './enums/data-breach-status.enum';
import { DataBreachRiskLevel } from './enums/data-breach-risk-level.enum';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((v: Partial<DataBreachIncident>) => v),
  save: jest.fn((v: Partial<DataBreachIncident>) => Promise.resolve(v)),
});

describe('DataBreachesService', () => {
  let service: DataBreachesService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataBreachesService,
        { provide: getRepositoryToken(DataBreachIncident), useValue: repo },
      ],
    }).compile();

    service = module.get(DataBreachesService);
  });

  describe('computeAuthorityNotificationDue', () => {
    it('is exactly 72 hours after detection', () => {
      const detectedAt = new Date('2026-01-01T00:00:00.000Z');
      const due = service.computeAuthorityNotificationDue(detectedAt);
      expect(due.getTime() - detectedAt.getTime()).toBe(72 * 3_600_000);
    });
  });

  describe('findOne', () => {
    it('throws NotFound when the incident is not in the org (multi-tenant)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('b1', ORG_B)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'b1', organizationId: ORG_B },
        relations: { assigneeMembership: { user: true } },
      });
    });
  });

  describe('create', () => {
    it('defaults status OPEN, risk MEDIUM and stamps detectedAt', async () => {
      const result = await service.create(
        { title: 'Lost laptop', description: 'unencrypted device lost' },
        ORG_A,
        'actor-1',
      );
      expect(result.status).toBe(DataBreachStatus.OPEN);
      expect(result.riskLevel).toBe(DataBreachRiskLevel.MEDIUM);
      expect(result.detectedAt).toBeInstanceOf(Date);
      expect(result.createdByMembershipId).toBe('actor-1');
      expect(result.organizationId).toBe(ORG_A);
    });
  });

  describe('update', () => {
    it('stamps closedAt when closing and clears it when reopening', async () => {
      repo.findOne.mockResolvedValue({
        id: 'b1',
        status: DataBreachStatus.OPEN,
        closedAt: null,
        organizationId: ORG_A,
      });
      const closed = await service.update(
        { id: 'b1', status: DataBreachStatus.CLOSED },
        ORG_A,
      );
      expect(closed.closedAt).toBeInstanceOf(Date);

      repo.findOne.mockResolvedValue({
        id: 'b1',
        status: DataBreachStatus.CLOSED,
        closedAt: new Date(),
        organizationId: ORG_A,
      });
      const reopened = await service.update(
        { id: 'b1', status: DataBreachStatus.INVESTIGATING },
        ORG_A,
      );
      expect(reopened.closedAt).toBeNull();
    });

    it('records authority + subject notification timestamps', async () => {
      repo.findOne.mockResolvedValue({
        id: 'b1',
        status: DataBreachStatus.OPEN,
        authorityNotifiedAt: null,
        subjectsNotifiedAt: null,
        organizationId: ORG_A,
      });

      const result = await service.update(
        { id: 'b1', authorityNotified: true, subjectsNotified: true },
        ORG_A,
      );

      expect(result.authorityNotifiedAt).toBeInstanceOf(Date);
      expect(result.subjectsNotifiedAt).toBeInstanceOf(Date);
    });

    it('clears the authority timestamp when unmarked', async () => {
      repo.findOne.mockResolvedValue({
        id: 'b1',
        status: DataBreachStatus.OPEN,
        authorityNotifiedAt: new Date(),
        organizationId: ORG_A,
      });

      const result = await service.update(
        { id: 'b1', authorityNotified: false },
        ORG_A,
      );

      expect(result.authorityNotifiedAt).toBeNull();
    });
  });
});
