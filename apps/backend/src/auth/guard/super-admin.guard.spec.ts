import { ForbiddenException } from '@nestjs/common';

import { SuperAdminGuard } from './super-admin.guard';
import {
  mockGqlExecutionContext,
  mockUser,
} from '@/common/testing/auth-test.util';

describe('SuperAdminGuard', () => {
  const guard = new SuperAdminGuard();

  it('allows a SuperAdmin', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ isSuperAdmin: true }),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects a normal (non-SuperAdmin) user', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ isSuperAdmin: false }),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects an unauthenticated request', () => {
    const ctx = mockGqlExecutionContext({ user: null });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
