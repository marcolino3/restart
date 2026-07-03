import { EntityManager } from 'typeorm';

import { MembershipGuard } from './membership.guard';
import { Membership } from '@/memberships/entities/membership.entity';
import {
  TEST_ORG_ID,
  mockGqlExecutionContext,
  mockUser,
} from '@/common/testing/auth-test.util';

describe('MembershipGuard', () => {
  let guard: MembershipGuard;
  let em: { exists: jest.Mock };

  beforeEach(() => {
    em = { exists: jest.fn() };
    guard = new MembershipGuard(em as unknown as EntityManager);
  });

  it('rejects when there is no active org', async () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ orgId: undefined }),
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
    expect(em.exists).not.toHaveBeenCalled();
  });

  it('rejects when there is no membership id', async () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ membershipId: undefined }),
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
    expect(em.exists).not.toHaveBeenCalled();
  });

  it('multi-tenant isolation: checks membership scoped to org + user + membership id', async () => {
    em.exists.mockResolvedValue(true);
    const user = mockUser({
      sub: 'user-1',
      orgId: TEST_ORG_ID,
      membershipId: 'membership-1',
    });
    const ctx = mockGqlExecutionContext({ user });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(em.exists).toHaveBeenCalledWith(Membership, {
      where: {
        id: 'membership-1',
        organizationId: TEST_ORG_ID,
        userId: 'user-1',
      },
    });
  });

  it('rejects when no matching membership exists in the active org', async () => {
    em.exists.mockResolvedValue(false);
    const ctx = mockGqlExecutionContext({ user: mockUser() });
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });
});
