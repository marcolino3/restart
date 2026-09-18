import { NotFoundException } from '@nestjs/common';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SchoolClassesService } from '@/school-management/school-classes/school-classes.service';
import { ClassBudgetAccessService } from './class-budget-access.service';

describe('ClassBudgetAccessService', () => {
  let schoolClasses: {
    findVisibleToUser: jest.Mock;
    schoolYearOf: jest.Mock;
  };
  let service: ClassBudgetAccessService;

  const teacher: TokenPayload = {
    sub: 'user-1',
    orgId: 'org-1',
    membershipId: 'membership-1',
    roles: ['EMPLOYEE'],
    permissions: ['CLASS_EXPENSE_READ', 'CLASS_EXPENSE_WRITE'],
  };

  beforeEach(() => {
    schoolClasses = {
      findVisibleToUser: jest.fn(),
      schoolYearOf: jest.fn(),
    };
    service = new ClassBudgetAccessService(
      schoolClasses as unknown as SchoolClassesService,
    );
  });

  describe('canManage', () => {
    it('is false for a teacher with only expense permissions', () => {
      expect(service.canManage(teacher)).toBe(false);
    });

    it('is true with CLASS_BUDGET_MANAGE', () => {
      expect(
        service.canManage({
          ...teacher,
          permissions: ['CLASS_BUDGET_MANAGE'],
        }),
      ).toBe(true);
    });

    it('is true for a SuperAdmin without any permission', () => {
      expect(
        service.canManage({ sub: 'root', isSuperAdmin: true, permissions: [] }),
      ).toBe(true);
    });

    it('is false when permissions are missing entirely', () => {
      expect(service.canManage({ sub: 'user-2' })).toBe(false);
    });
  });

  describe('assertSchoolClassAccessible', () => {
    it('resolves visibility with the caller identity and active org', async () => {
      schoolClasses.findVisibleToUser.mockResolvedValue([{ id: 'class-a' }]);

      await expect(
        service.assertSchoolClassAccessible('class-a', 'org-1', teacher),
      ).resolves.toBeUndefined();
      expect(schoolClasses.findVisibleToUser).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        ['EMPLOYEE'],
        false,
      );
    });

    it('reports a class outside the visible set as NotFound', async () => {
      schoolClasses.findVisibleToUser.mockResolvedValue([{ id: 'class-a' }]);

      await expect(
        service.assertSchoolClassAccessible('class-foreign', 'org-1', teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects everything when the caller sees no class at all', async () => {
      schoolClasses.findVisibleToUser.mockResolvedValue([]);

      await expect(
        service.assertSchoolClassAccessible('class-a', 'org-1', teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('schoolYearStarting', () => {
    it('anchors on 31 December so any cut-off resolves to that start year', async () => {
      schoolClasses.schoolYearOf.mockResolvedValue({ startYear: 2026 });

      await service.schoolYearStarting('org-1', 2026);

      expect(schoolClasses.schoolYearOf).toHaveBeenCalledWith(
        'org-1',
        '2026-12-31',
      );
    });
  });
});
