import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { GraphQLPermissionsGuard } from './graphql-permissions.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import {
  mockGqlExecutionContext,
  mockUser,
} from '@/common/testing/auth-test.util';

/** A handler carrying the given required-permissions metadata. */
function handlerRequiring(perms: string[] | undefined): () => void {
  const handler = () => undefined;
  if (perms) Reflect.defineMetadata(PERMS_KEY, perms, handler);
  return handler;
}

describe('GraphQLPermissionsGuard', () => {
  let guard: GraphQLPermissionsGuard;

  beforeEach(() => {
    guard = new GraphQLPermissionsGuard(new Reflector());
  });

  it('allows when no permissions are required', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ permissions: [] }),
      handler: handlerRequiring(undefined),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lets SuperAdmin bypass the permission check', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ isSuperAdmin: true, permissions: [] }),
      handler: handlerRequiring(['TIMESHEET_WRITE']),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when the user has no permissions at all', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ permissions: [] }),
      handler: handlerRequiring(['TIMESHEET_WRITE']),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when the user is missing one of several required permissions', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ permissions: ['TIMESHEET_READ'] }),
      handler: handlerRequiring(['TIMESHEET_READ', 'TIMESHEET_WRITE']),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows when the user holds every required permission', () => {
    const ctx = mockGqlExecutionContext({
      user: mockUser({ permissions: ['TIMESHEET_READ', 'TIMESHEET_WRITE'] }),
      handler: handlerRequiring(['TIMESHEET_READ', 'TIMESHEET_WRITE']),
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects an unauthenticated request when permissions are required', () => {
    const ctx = mockGqlExecutionContext({
      user: null,
      handler: handlerRequiring(['TIMESHEET_WRITE']),
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
