import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { OrganizationAuditLogService } from './organization-audit-log.service';
import { OrganizationAuditLog } from '@/organizations/entities/organization-audit-log.entity';
import { OrganizationAuditAction } from '@restart/shared-schemas/organizations/organization-enums';

describe('OrganizationAuditLogService', () => {
  let service: OrganizationAuditLogService;
  let create: jest.Mock;
  let save: jest.Mock;
  let findAndCount: jest.Mock;

  const orgId = 'org-1';
  const otherOrgId = 'org-2';
  const actorUserId = 'user-1';

  beforeEach(async () => {
    create = jest.fn((data) => data);
    save = jest.fn((data) => Promise.resolve({ id: 'log-1', ...data }));
    findAndCount = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationAuditLogService,
        {
          provide: getRepositoryToken(OrganizationAuditLog),
          useValue: { create, save, findAndCount },
        },
      ],
    }).compile();

    service = module.get(OrganizationAuditLogService);
  });

  describe('record', () => {
    it('creates and saves an entry scoped to the given organization', async () => {
      const result = await service.record(
        orgId,
        OrganizationAuditAction.PLAN_CHANGED,
        actorUserId,
        { plan: 'PROFESSIONAL' },
      );

      expect(create).toHaveBeenCalledWith({
        organizationId: orgId,
        action: OrganizationAuditAction.PLAN_CHANGED,
        actorUserId,
        payload: { plan: 'PROFESSIONAL' },
      });
      expect(save).toHaveBeenCalled();
      expect(result.organizationId).toBe(orgId);
    });

    it('allows omitting actorUserId and payload', async () => {
      await service.record(orgId, OrganizationAuditAction.SUSPENDED);

      expect(create).toHaveBeenCalledWith({
        organizationId: orgId,
        action: OrganizationAuditAction.SUSPENDED,
        actorUserId: undefined,
        payload: undefined,
      });
    });
  });

  describe('findPaginated', () => {
    it('queries scoped to the given organization with pagination and ordering', async () => {
      findAndCount.mockResolvedValue([[], 0]);

      await service.findPaginated(orgId, 20, 0);

      expect(findAndCount).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
        relations: ['actorUser'],
      });
    });

    it('returns items and total from the repository', async () => {
      const entries = [
        { id: 'log-1', organizationId: orgId } as OrganizationAuditLog,
      ];
      findAndCount.mockResolvedValue([entries, 1]);

      const result = await service.findPaginated(orgId, 20, 0);

      expect(result).toEqual({ items: entries, total: 1 });
    });

    it('does not leak entries from another organization', async () => {
      findAndCount.mockImplementation((options) => {
        const scopedOrgId = (options?.where as { organizationId: string })
          .organizationId;
        const all = [
          { id: 'log-1', organizationId: orgId },
          { id: 'log-2', organizationId: otherOrgId },
        ] as OrganizationAuditLog[];
        const items = all.filter((e) => e.organizationId === scopedOrgId);
        return Promise.resolve([items, items.length]);
      });

      const result = await service.findPaginated(orgId, 20, 0);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].organizationId).toBe(orgId);
    });
  });
});
