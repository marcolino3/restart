import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { OrganizationsService } from './organizations.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { GeocodingService } from '@/google/geocoding.service';
import { OrganizationAuditLogService } from './organization-audit-log.service';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

// Mock seeders to avoid deep repository calls in unit tests
jest.mock(
  '@/employee-management/employee-absence-categories/seeds/seed-org-employee-absence-categories.seeder',
  () => ({
    seedOrgEmployeeAbsenceCategories: jest.fn().mockResolvedValue(undefined),
  }),
);
jest.mock(
  '@/employee-management/employee-functions/seeds/seed-org-employee-functions.seeder',
  () => ({
    seedOrgEmployeeFunctions: jest.fn().mockResolvedValue(undefined),
  }),
);
jest.mock('@/roles/seeds/system-roles.seeder', () => ({
  seedOrgSystemRoles: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/roles/seeds/assign-permissions-to-system-roles.seeder', () => ({
  assignPermissionsToOrgSystemRoles: jest.fn().mockResolvedValue(undefined),
}));
jest.mock(
  '@/school-management/admission-stages/seeds/default-admission-stages',
  () => ({
    seedOrgAdmissionStages: jest.fn().mockResolvedValue(undefined),
  }),
);
jest.mock(
  '@/school-management/admission-sources/seeds/default-admission-sources',
  () => ({
    seedOrgAdmissionSources: jest.fn().mockResolvedValue(undefined),
  }),
);

// ── helpers ────────────────────────────────────────────────────────
const mockOrg = (overrides: Partial<Organization> = {}): Organization =>
  ({
    id: 'org-1',
    name: 'Acme',
    subdomain: 'acme',
    timezone: 'Europe/Berlin',
    isActive: true,
    isArchived: false,
    ...overrides,
  }) as Organization;

const superAdmin: TokenPayload = {
  sub: 'user-sa',
  isSuperAdmin: true,
};

const regularUser: TokenPayload = {
  sub: 'user-1',
  orgId: 'org-1',
  isSuperAdmin: false,
};

// ── mock factories ─────────────────────────────────────────────────
const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  exists: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const createMockEntityManager = () => {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return {
    transaction: jest.fn((cb: (m: typeof txManager) => unknown) =>
      cb(txManager),
    ),
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
    }),
    exists: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_: unknown, data: Record<string, unknown>) => ({
      id: 'new-org',
      ...data,
    })),
    query: jest.fn(),
    _qb: qb,
  };
};

const createMockGeocodingService = () => ({
  geocode: jest.fn().mockResolvedValue(null),
});

const createMockAuditLogService = () => ({
  record: jest.fn().mockResolvedValue(undefined),
  findPaginated: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
});

// shared transaction-scoped manager mock
const txManager = {
  save: jest
    .fn()
    .mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: 'new-org', ...data }),
    ),
  create: jest.fn((_: unknown, data: Record<string, unknown>) => data),
  getRepository: jest.fn().mockReturnValue({
    create: jest.fn((data: Record<string, unknown>) => data),
    insert: jest.fn().mockResolvedValue({ identifiers: [] }),
  }),
};

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: ReturnType<typeof createMockRepository>;
  let em: ReturnType<typeof createMockEntityManager>;
  let geocoding: ReturnType<typeof createMockGeocodingService>;
  let auditLog: ReturnType<typeof createMockAuditLogService>;

  beforeEach(async () => {
    orgRepo = createMockRepository();
    em = createMockEntityManager();
    geocoding = createMockGeocodingService();
    auditLog = createMockAuditLogService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: EntityManager, useValue: em },
        { provide: GeocodingService, useValue: geocoding },
        { provide: OrganizationAuditLogService, useValue: auditLog },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  // ── create ───────────────────────────────────────────────────────
  describe('create', () => {
    it('should create an organization inside a transaction', async () => {
      const result = await service.create({
        organizationName: 'New Org',
      });
      expect(em.transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(txManager.create).toHaveBeenCalled();
      expect(txManager.save).toHaveBeenCalled();
    });
  });

  // ── findAllForUser (multi-tenant isolation) ──────────────────────
  describe('findAllForUser', () => {
    it('should return all non-archived orgs for superadmin', async () => {
      const orgs = [mockOrg()];
      orgRepo.find.mockResolvedValue(orgs);

      const result = await service.findAllForUser(superAdmin);
      expect(orgRepo.find).toHaveBeenCalledWith({
        where: { isArchived: false },
      });
      expect(result).toEqual(orgs);
    });

    it('should return only membership-linked orgs for regular user (org isolation)', async () => {
      const orgs = [mockOrg()];
      em._qb.getMany.mockResolvedValue(orgs);

      const result = await service.findAllForUser(regularUser);
      expect(em.getRepository).toHaveBeenCalledWith(Organization);
      // the membership join MUST be scoped to the calling user's id
      expect(em._qb.innerJoin).toHaveBeenCalledWith(
        expect.anything(),
        'm',
        'm.organization_id = o.id AND m.user_id = :uid',
        { uid: regularUser.sub },
      );
      expect(result).toEqual(orgs);
    });

    it('should not use the unrestricted superadmin path for regular users', async () => {
      await service.findAllForUser(regularUser);
      expect(orgRepo.find).not.toHaveBeenCalled();
    });
  });

  // ── findOneForUser (multi-tenant isolation) ──────────────────────
  describe('findOneForUser', () => {
    it('should return org for superadmin without membership check', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);

      const result = await service.findOneForUser('org-1', superAdmin);
      expect(result).toEqual(org);
      expect(em.exists).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if org does not exist', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findOneForUser('nonexistent', superAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no membership (org isolation)', async () => {
      orgRepo.findOne.mockResolvedValue(mockOrg({ id: 'foreign-org' }));
      em.exists.mockResolvedValue(false);

      await expect(
        service.findOneForUser('foreign-org', regularUser),
      ).rejects.toThrow(ForbiddenException);
      expect(em.exists).toHaveBeenCalledWith(expect.anything(), {
        where: { organizationId: 'foreign-org', userId: regularUser.sub },
      });
    });

    it('should return org if user has membership', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      em.exists.mockResolvedValue(true);

      const result = await service.findOneForUser('org-1', regularUser);
      expect(result).toEqual(org);
    });
  });

  // ── findBySubdomain ──────────────────────────────────────────────
  describe('findBySubdomain', () => {
    it('should return org by subdomain (case insensitive, trimmed)', async () => {
      const org = mockOrg({ subdomain: 'acme' });
      orgRepo.findOne.mockResolvedValue(org);

      const result = await service.findBySubdomain('  ACME  ');
      expect(orgRepo.findOne).toHaveBeenCalledWith({
        where: { subdomain: 'acme' },
      });
      expect(result).toEqual(org);
    });

    it('should throw NotFoundException for unknown subdomain', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySubdomain('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── availability checks ──────────────────────────────────────────
  describe('isSubdomainAvailable', () => {
    it('should return false for empty subdomain', async () => {
      await expect(service.isSubdomainAvailable('   ')).resolves.toBe(false);
      expect(orgRepo.exists).not.toHaveBeenCalled();
    });

    it('should return true when subdomain is not taken', async () => {
      orgRepo.exists.mockResolvedValue(false);
      await expect(service.isSubdomainAvailable(' Free ')).resolves.toBe(true);
      expect(orgRepo.exists).toHaveBeenCalledWith({
        where: { subdomain: 'free' },
      });
    });

    it('should return false when subdomain is taken', async () => {
      orgRepo.exists.mockResolvedValue(true);
      await expect(service.isSubdomainAvailable('taken')).resolves.toBe(false);
    });
  });

  describe('isDomainAvailable', () => {
    it('should return false for empty domain', async () => {
      await expect(service.isDomainAvailable('')).resolves.toBe(false);
      expect(orgRepo.exists).not.toHaveBeenCalled();
    });

    it('should return true when domain is not taken', async () => {
      orgRepo.exists.mockResolvedValue(false);
      await expect(service.isDomainAvailable('Acme.COM')).resolves.toBe(true);
      expect(orgRepo.exists).toHaveBeenCalledWith({
        where: { domain: 'acme.com' },
      });
    });
  });

  // ── updateOrganization ───────────────────────────────────────────
  describe('updateOrganization', () => {
    it('should update org name', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.updateOrganization('org-1', {
        id: 'org-1',
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
      expect(geocoding.geocode).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if org does not exist', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateOrganization('org-1', { id: 'org-1', name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate subdomain change', async () => {
      const org = mockOrg({ subdomain: 'acme' });
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.exists.mockResolvedValue(true);

      await expect(
        service.updateOrganization('org-1', {
          id: 'org-1',
          subdomain: 'taken-subdomain',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate domain change', async () => {
      const org = mockOrg({ domain: 'acme.com' });
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.exists.mockResolvedValue(true);

      await expect(
        service.updateOrganization('org-1', {
          id: 'org-1',
          domain: 'taken.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should geocode and store coordinates when an address field changes', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));
      geocoding.geocode.mockResolvedValue({ latitude: 47.37, longitude: 8.54 });

      const result = await service.updateOrganization('org-1', {
        id: 'org-1',
        street: 'Bahnhofstrasse 1',
        zip: '8001',
        city: 'Zürich',
        country: 'CH',
      });

      expect(geocoding.geocode).toHaveBeenCalledWith({
        street: 'Bahnhofstrasse 1',
        zip: '8001',
        city: 'Zürich',
        country: 'CH',
      });
      expect(result.latitude).toBe(47.37);
      expect(result.longitude).toBe(8.54);
      expect(result.location).toBe('(8.54,47.37)');
    });

    it('should still save when geocoding fails', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));
      geocoding.geocode.mockRejectedValue(new Error('geocoding down'));

      const result = await service.updateOrganization('org-1', {
        id: 'org-1',
        city: 'Bern',
      });

      expect(orgRepo.save).toHaveBeenCalled();
      expect(result.city).toBe('Bern');
    });

    it('should not geocode when no address field is part of the input', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));

      await service.updateOrganization('org-1', {
        id: 'org-1',
        name: 'Renamed',
      });
      expect(geocoding.geocode).not.toHaveBeenCalled();
    });
  });

  // ── removeOrganization ───────────────────────────────────────────
  describe('removeOrganization', () => {
    it('should deactivate and archive org (soft delete)', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.removeOrganization('org-1');
      expect(result.isActive).toBe(false);
      expect(result.isArchived).toBe(true);
      expect(orgRepo.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing org', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(service.removeOrganization('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getOrganizationsOverview ─────────────────────────────────────
  describe('getOrganizationsOverview', () => {
    it('aggregates member/child/enabled-feature counts and lifecycle stats', async () => {
      const orgs = [
        mockOrg({ id: 'org-1', lifecycleStatus: 'ACTIVE' }),
        mockOrg({
          id: 'org-2',
          lifecycleStatus: 'TRIAL',
          trialEndsAt: futureDate(5),
        }),
        mockOrg({ id: 'org-3', lifecycleStatus: 'SUSPENDED' }),
      ];
      orgRepo.find.mockResolvedValue(orgs);

      const qbResult = [
        {
          orgId: 'org-1',
          memberCount: '3',
          childCount: '10',
          enabledFeatureCount: '8',
        },
        {
          orgId: 'org-2',
          memberCount: '1',
          childCount: '0',
          enabledFeatureCount: '4',
        },
      ];
      const qb = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(qbResult),
      };
      orgRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getOrganizationsOverview();

      expect(result.stats).toEqual({
        activeCount: 1,
        trialCount: 1,
        suspendedCount: 1,
        totalUserCount: 4,
      });

      const row1 = result.rows.find((r) => r.organization.id === 'org-1');
      expect(row1?.memberCount).toBe(3);
      expect(row1?.childCount).toBe(10);
      expect(row1?.enabledFeatureCount).toBe(8);

      const row2 = result.rows.find((r) => r.organization.id === 'org-2');
      expect(row2?.trialDaysRemaining).toBeGreaterThanOrEqual(4);

      const row3 = result.rows.find((r) => r.organization.id === 'org-3');
      expect(row3?.memberCount).toBe(0);
    });
  });

  // ── getOrganizationUsage ─────────────────────────────────────────
  describe('getOrganizationUsage', () => {
    it('throws NotFoundException for missing org', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(service.getOrganizationUsage('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('derives usage numbers from membership/student/session queries', async () => {
      orgRepo.findOne.mockResolvedValue(mockOrg());
      em.query
        .mockResolvedValueOnce([{ count: 5 }])
        .mockResolvedValueOnce([{ count: 12 }])
        .mockResolvedValueOnce([
          {
            active_users_30d: 3,
            last_login_at: new Date('2026-08-01T00:00:00Z'),
            logins_30d: 60,
          },
        ]);

      const result = await service.getOrganizationUsage('org-1');

      expect(result.userCount).toBe(5);
      expect(result.childCount).toBe(12);
      expect(result.activeUsersLast30Days).toBe(3);
      expect(result.avgLoginsPerDay).toBe(2);
      expect(result.lastLoginAt).toEqual(new Date('2026-08-01T00:00:00Z'));
    });
  });

  // ── suspendOrganization / reactivateOrganization ──────────────────
  describe('suspendOrganization', () => {
    it('sets lifecycleStatus=SUSPENDED, deactivates and writes an audit log entry', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.suspendOrganization(
        'org-1',
        'Zahlung ausstehend',
        'actor-1',
      );

      expect(result.lifecycleStatus).toBe('SUSPENDED');
      expect(result.isActive).toBe(false);
      expect(result.suspendedReason).toBe('Zahlung ausstehend');
      expect(result.suspendedById).toBe('actor-1');
      expect(auditLog.record).toHaveBeenCalledWith(
        'org-1',
        'SUSPENDED',
        'actor-1',
        { reason: 'Zahlung ausstehend' },
      );
    });

    it('throws NotFoundException for missing org', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(
        service.suspendOrganization('nonexistent', undefined, 'actor-1'),
      ).rejects.toThrow(NotFoundException);
      expect(auditLog.record).not.toHaveBeenCalled();
    });
  });

  describe('reactivateOrganization', () => {
    it('sets lifecycleStatus=ACTIVE, reactivates and clears suspend fields', async () => {
      const org = mockOrg({
        lifecycleStatus: 'SUSPENDED',
        isActive: false,
        suspendedAt: new Date(),
        suspendedReason: 'was suspended',
        suspendedById: 'actor-1',
      });
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.reactivateOrganization('org-1', 'actor-2');

      expect(result.lifecycleStatus).toBe('ACTIVE');
      expect(result.isActive).toBe(true);
      expect(result.suspendedAt).toBeUndefined();
      expect(result.suspendedReason).toBeUndefined();
      expect(result.suspendedById).toBeUndefined();
      expect(auditLog.record).toHaveBeenCalledWith(
        'org-1',
        'REACTIVATED',
        'actor-2',
      );
    });
  });

  // ── changeOrganizationPlan ────────────────────────────────────────
  describe('changeOrganizationPlan', () => {
    it('updates plan fields and writes before/after to the audit log', async () => {
      const org = mockOrg({ plan: 'STARTER', userLicenseLimit: 10 });
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.changeOrganizationPlan(
        {
          id: 'org-1',
          plan: 'PROFESSIONAL',
          userLicenseLimit: 50,
        },
        'actor-1',
      );

      expect(result.plan).toBe('PROFESSIONAL');
      expect(result.userLicenseLimit).toBe(50);
      expect(auditLog.record).toHaveBeenCalledWith(
        'org-1',
        'PLAN_CHANGED',
        'actor-1',
        expect.objectContaining({
          before: expect.objectContaining({
            plan: 'STARTER',
            userLicenseLimit: 10,
          }),
          after: expect.objectContaining({
            plan: 'PROFESSIONAL',
            userLicenseLimit: 50,
          }),
        }),
      );
    });
  });

  // ── getOrganizationAuditLog ────────────────────────────────────────
  describe('getOrganizationAuditLog', () => {
    it('delegates pagination to OrganizationAuditLogService', async () => {
      auditLog.findPaginated.mockResolvedValue({ items: [], total: 0 });
      await service.getOrganizationAuditLog('org-1', 25, 0);
      expect(auditLog.findPaginated).toHaveBeenCalledWith('org-1', 25, 0);
    });
  });

  // ── exportOrganizationData ────────────────────────────────────────
  describe('exportOrganizationData', () => {
    it('creates an export job and writes a DATA_EXPORTED audit log entry', async () => {
      orgRepo.findOne.mockResolvedValue(mockOrg());

      const result = await service.exportOrganizationData('org-1', 'actor-1');

      expect(result.status).toBe('QUEUED');
      expect(result.jobId).toContain('org-1');
      expect(auditLog.record).toHaveBeenCalledWith(
        'org-1',
        'DATA_EXPORTED',
        'actor-1',
        expect.objectContaining({ jobId: result.jobId }),
      );
    });

    it('throws NotFoundException for missing org', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(
        service.exportOrganizationData('nonexistent', 'actor-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
