import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';

import { RetentionPoliciesService } from './retention-policies.service';
import { RetentionPolicy } from './entities/retention-policy.entity';
import { RetentionAction } from './enums/retention-action.enum';
import { RetentionEntityType } from './enums/retention-entity-type.enum';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((v: Partial<RetentionPolicy>) => v),
  save: jest.fn((v: Partial<RetentionPolicy>) => Promise.resolve(v)),
  remove: jest.fn((v: Partial<RetentionPolicy>) => Promise.resolve(v)),
});

describe('RetentionPoliciesService', () => {
  let service: RetentionPoliciesService;
  let repo: ReturnType<typeof createMockRepository>;
  let manager: { count: jest.Mock };

  beforeEach(async () => {
    repo = createMockRepository();
    manager = { count: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionPoliciesService,
        { provide: getRepositoryToken(RetentionPolicy), useValue: repo },
        { provide: getEntityManagerToken(), useValue: manager },
      ],
    }).compile();

    service = module.get(RetentionPoliciesService);
  });

  describe('upsert', () => {
    it('creates a new policy scoped to the org when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.upsert(
        {
          entityType: RetentionEntityType.STUDENT,
          retentionMonths: 36,
          action: RetentionAction.ANONYMIZE,
        },
        ORG_A,
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          entityType: RetentionEntityType.STUDENT,
        }),
      );
      expect(result.retentionMonths).toBe(36);
      expect(result.action).toBe(RetentionAction.ANONYMIZE);
    });

    it('updates the existing policy in place', async () => {
      const existing = {
        id: 'p1',
        organizationId: ORG_A,
        entityType: RetentionEntityType.STUDENT,
        retentionMonths: 12,
        action: RetentionAction.ANONYMIZE,
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.upsert(
        {
          entityType: RetentionEntityType.STUDENT,
          retentionMonths: 48,
          action: RetentionAction.DELETE,
        },
        ORG_A,
      );

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.retentionMonths).toBe(48);
      expect(result.action).toBe(RetentionAction.DELETE);
    });
  });

  describe('delete', () => {
    it('throws NotFound for a policy outside the org (multi-tenant)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.delete('p1', ORG_B)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'p1', organizationId: ORG_B },
      });
    });
  });

  describe('computeDueCount', () => {
    it('returns null for a type without a wired anchor', async () => {
      const result = await service.computeDueCount(
        RetentionEntityType.EMPLOYEE,
        12,
        ORG_A,
      );
      expect(result).toBeNull();
      expect(manager.count).not.toHaveBeenCalled();
    });

    it('counts due students scoped to the org', async () => {
      manager.count.mockResolvedValue(7);
      const result = await service.computeDueCount(
        RetentionEntityType.STUDENT,
        36,
        ORG_A,
      );
      expect(result).toBe(7);
      expect(manager.count).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_A }),
        }),
      );
    });
  });
});
