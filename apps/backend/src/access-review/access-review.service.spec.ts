import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { AccessReviewService } from './access-review.service';
import { Membership } from '@/memberships/entities/membership.entity';

const ORG_A = 'org-a';

describe('AccessReviewService', () => {
  let service: AccessReviewService;
  let manager: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    manager = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((_e: unknown, v: Record<string, unknown>) => v),
      save: jest.fn((_e: unknown, v: Record<string, unknown>) =>
        Promise.resolve(v),
      ),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessReviewService,
        { provide: getEntityManagerToken(), useValue: manager },
      ],
    }).compile();

    service = module.get(AccessReviewService);
  });

  describe('getReview', () => {
    it('lists only members with a sensitive permission, scoped to the org', async () => {
      manager.find.mockImplementation((entity: unknown) => {
        if (entity === Membership) {
          return Promise.resolve([
            {
              id: 'm1',
              user: { firstName: 'Ada', lastName: 'Lovelace' },
              roles: [
                {
                  name: 'HR',
                  permissions: [{ code: 'EMPLOYEE_WRITE' }],
                },
              ],
            },
            {
              id: 'm2',
              user: { firstName: 'Bob', lastName: 'Builder' },
              roles: [
                {
                  name: 'Teacher',
                  permissions: [{ code: 'SCHOOL_CLASS_READ' }],
                },
              ],
            },
          ]);
        }
        return Promise.resolve([]); // records
      });

      const result = await service.getReview(ORG_A);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        membershipId: 'm1',
        memberName: 'Ada Lovelace',
        sensitivePermissions: ['EMPLOYEE_WRITE'],
        lastReviewedAt: null,
      });
      expect(manager.find).toHaveBeenCalledWith(Membership, {
        where: { organizationId: ORG_A },
        relations: { user: true, roles: { permissions: true } },
      });
    });
  });

  describe('recertify', () => {
    it('creates a record with a fresh reviewed timestamp when none exists', async () => {
      manager.findOne.mockResolvedValue(null);

      const ok = await service.recertify(
        'm1',
        ORG_A,
        'reviewer-1',
        'looks good',
      );

      expect(ok).toBe(true);
      expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), {
        where: { organizationId: ORG_A, membershipId: 'm1' },
      });
      const saved = manager.save.mock.calls[0][1] as {
        lastReviewedAt: Date;
        reviewedByMembershipId: string | null;
      };
      expect(saved.lastReviewedAt).toBeInstanceOf(Date);
      expect(saved.reviewedByMembershipId).toBe('reviewer-1');
    });
  });
});
