import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { GraphQLAccessGuard } from './graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { SUPER_ADMIN_KEY } from '@/auth/decorators/super-admin.decorator';
import { SystemRole } from '@/roles/entities/system-role.enum';
import {
  mockGqlExecutionContext,
  mockUser,
} from '@/common/testing/auth-test.util';

/** A handler carrying the given required-roles/permissions metadata. */
function handlerRequiring(opts: {
  roles?: SystemRole[];
  perms?: string[];
}): () => void {
  const handler = () => undefined;
  if (opts.roles) Reflect.defineMetadata(ROLES_KEY, opts.roles, handler);
  if (opts.perms) Reflect.defineMetadata(PERMS_KEY, opts.perms, handler);
  return handler;
}

describe('GraphQLAccessGuard', () => {
  let guard: GraphQLAccessGuard;

  beforeEach(() => {
    guard = new GraphQLAccessGuard(new Reflector());
  });

  it('allows when neither roles nor permissions are required', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ roles: [], permissions: [] }),
      handler: handlerRequiring({}),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lets SuperAdmin bypass every check', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ isSuperAdmin: true, roles: [], permissions: [] }),
      handler: handlerRequiring({
        roles: [SystemRole.ORG_OWNER],
        perms: ['TIMESHEET_WRITE'],
      }),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when the role matches but a required permission is missing', () => {
    // Regression test: a matching role must NOT bypass a missing permission.
    const ctx = mockGqlExecutionContext({
      user: mockUser({
        roles: [SystemRole.ORG_ADMIN],
        permissions: [],
      }),
      handler: handlerRequiring({
        roles: [SystemRole.ORG_ADMIN],
        perms: ['TIMESHEET_WRITE'],
      }),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when the permission matches but no required role is held', () => {
    // Regression test: a matching permission must NOT bypass a missing role.
    const ctx = mockGqlExecutionContext({
      user: mockUser({
        roles: [SystemRole.EMPLOYEE],
        permissions: ['TIMESHEET_WRITE'],
      }),
      handler: handlerRequiring({
        roles: [SystemRole.ORG_ADMIN],
        perms: ['TIMESHEET_WRITE'],
      }),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows when both the required role and permission are held', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({
        roles: [SystemRole.ORG_ADMIN],
        permissions: ['TIMESHEET_WRITE'],
      }),
      handler: handlerRequiring({
        roles: [SystemRole.ORG_ADMIN],
        perms: ['TIMESHEET_WRITE'],
      }),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows via role alone when only roles are required', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ roles: [SystemRole.ORG_ADMIN], permissions: [] }),
      handler: handlerRequiring({ roles: [SystemRole.ORG_ADMIN] }),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows via permission alone when only permissions are required', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ roles: [], permissions: ['TIMESHEET_WRITE'] }),
      handler: handlerRequiring({ perms: ['TIMESHEET_WRITE'] }),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects an unauthenticated request when access is gated', () => {
    const ctx = mockGqlExecutionContext({
      user: null,
      handler: handlerRequiring({ perms: ['TIMESHEET_WRITE'] }),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects a non-SuperAdmin from a SuperAdmin-only handler', () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SUPER_ADMIN_KEY, true, handler);
    const ctx = mockGqlExecutionContext({
      user: mockUser({ isSuperAdmin: false }),
      handler,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
