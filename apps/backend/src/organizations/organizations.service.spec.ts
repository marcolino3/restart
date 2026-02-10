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
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

// Mock seeders to avoid deep repository calls in unit tests
jest.mock(
  '@/employee-management/employee-absence-categories/seeds/seed-org-employee-absence-categories.seeder',
  () => ({
    seedOrgEmployeeAbsenceCategories: jest.fn().mockResolvedValue(undefined),
  }),
);
jest.mock('@/roles/seeds/system-roles.seeder', () => ({
  seedOrgSystemRoles: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/roles/seeds/assign-permissions-to-system-roles.seeder', () => ({
  assignPermissionsToOrgSystemRoles: jest.fn().mockResolvedValue(undefined),
}));

// ── helpers ────────────────────────────────────────────────────────
const mockOrg = (overrides: Partial<Organization> = {}): Organization =>
  ({
    id: 'org-1',
    name: 'Acme',
    slug: 'acme',
    timezone: 'Europe/Berlin',
    isActive: true,
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
  exist: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const createMockEntityManager = () => {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return {
    transaction: jest.fn((cb: (m: any) => any) => cb(txManager)),
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
    }),
    exists: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_, data) => ({ id: 'new-org', ...data })),
    _qb: qb,
  };
};

// shared transaction-scoped manager mock
const txManager = {
  save: jest
    .fn()
    .mockImplementation((data) => Promise.resolve({ id: 'new-org', ...data })),
  create: jest.fn((_, data) => data),
};

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: ReturnType<typeof createMockRepository>;
  let em: ReturnType<typeof createMockEntityManager>;

  beforeEach(async () => {
    orgRepo = createMockRepository();
    em = createMockEntityManager();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  // ── create ───────────────────────────────────────────────────────
  describe('create', () => {
    it('should create an organization inside a transaction', async () => {
      const result = await service.create();
      expect(em.transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(txManager.create).toHaveBeenCalled();
      expect(txManager.save).toHaveBeenCalled();
    });
  });

  // ── findAllForUser ───────────────────────────────────────────────
  describe('findAllForUser', () => {
    it('should return all orgs for superadmin', async () => {
      const orgs = [mockOrg()];
      orgRepo.find.mockResolvedValue(orgs);

      const result = await service.findAllForUser(superAdmin);
      expect(orgRepo.find).toHaveBeenCalled();
      expect(result).toEqual(orgs);
    });

    it('should return only membership-linked orgs for regular user', async () => {
      const orgs = [mockOrg()];
      em._qb.getMany.mockResolvedValue(orgs);

      const result = await service.findAllForUser(regularUser);
      expect(em.getRepository).toHaveBeenCalledWith(Organization);
      expect(result).toEqual(orgs);
    });
  });

  // ── findOneForUser ───────────────────────────────────────────────
  describe('findOneForUser', () => {
    it('should return org for superadmin', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);

      const result = await service.findOneForUser('org-1', superAdmin);
      expect(result).toEqual(org);
    });

    it('should throw NotFoundException if org does not exist', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findOneForUser('nonexistent', superAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no membership', async () => {
      orgRepo.findOne.mockResolvedValue(mockOrg());
      em.exists.mockResolvedValue(false);

      await expect(
        service.findOneForUser('org-1', regularUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return org if user has membership', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      em.exists.mockResolvedValue(true);

      const result = await service.findOneForUser('org-1', regularUser);
      expect(result).toEqual(org);
    });
  });

  // ── findBySlug ───────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('should return org by slug (case insensitive, trimmed)', async () => {
      const org = mockOrg({ slug: 'acme' });
      orgRepo.findOne.mockResolvedValue(org);

      const result = await service.findBySlug('  ACME  ');
      expect(orgRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'acme' },
      });
      expect(result).toEqual(org);
    });

    it('should throw NotFoundException for unknown slug', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── isSlugAvailable ──────────────────────────────────────────────
  describe('isSlugAvailable', () => {
    it('should return true when slug is not taken', async () => {
      orgRepo.exist.mockResolvedValue(false);
      expect(await service.isSlugAvailable('free-slug')).toBe(true);
    });

    it('should return false when slug is taken', async () => {
      orgRepo.exist.mockResolvedValue(true);
      expect(await service.isSlugAvailable('taken')).toBe(false);
    });

    it('should return false for empty slug', async () => {
      expect(await service.isSlugAvailable('  ')).toBe(false);
    });
  });

  // ── updateForActiveOrg ───────────────────────────────────────────
  describe('updateForActiveOrg', () => {
    it('should update org name for superadmin', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockResolvedValue({ ...org, name: 'New Name' });

      const result = await service.updateForActiveOrg(
        'org-1',
        { id: 'org-1', name: 'New Name' },
        superAdmin,
      );
      expect(result.name).toBe('New Name');
    });

    it('should throw ConflictException on duplicate slug change', async () => {
      const org = mockOrg({ slug: 'acme' });
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.exist.mockResolvedValue(true); // slug taken

      await expect(
        service.updateForActiveOrg(
          'org-1',
          { id: 'org-1', slug: 'taken-slug' },
          superAdmin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for non-admin regular user', async () => {
      // userHasRoleInOrg will return false because mocked membership findOne returns null
      em.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(em._qb),
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateForActiveOrg(
          'org-1',
          { id: 'org-1', name: 'Test' },
          regularUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── removeForActiveOrg ───────────────────────────────────────────
  describe('removeForActiveOrg', () => {
    it('should deactivate org as superadmin', async () => {
      const org = mockOrg();
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockResolvedValue({ ...org, isActive: false });

      const result = await service.removeForActiveOrg('org-1', superAdmin);
      expect((result as Organization).isActive).toBe(false);
    });

    it('should throw NotFoundException for missing org', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      await expect(
        service.removeForActiveOrg('nonexistent', superAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner regular user', async () => {
      em.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(em._qb),
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.removeForActiveOrg('org-1', regularUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
