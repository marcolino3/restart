import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityManager } from 'typeorm';

import { BetterAuthGuard } from './better-auth.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { auth } from '@/lib/auth';
import { getAuthContext } from '@/auth/utils/get-auth-context.util';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { UsersService } from '@/users/users.service';

jest.mock('@/lib/auth', () => ({
  auth: { api: { getSession: jest.fn() } },
}));
jest.mock('@/auth/utils/get-auth-context.util', () => ({
  getAuthContext: jest.fn(),
}));

const getSession = auth.api.getSession as unknown as jest.Mock;
const getAuthContextMock = getAuthContext as unknown as jest.Mock;

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

describe('BetterAuthGuard', () => {
  const ORG_ID = 'org-1';

  let em: { existsBy: jest.Mock };
  let usersService: { findOneByEmail: jest.Mock };
  let guard: BetterAuthGuard;
  let req: { headers: Record<string, string>; user?: unknown };

  const buildContext = (handler: () => void): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
      getClass: () => class {},
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    em = { existsBy: jest.fn() };
    usersService = { findOneByEmail: jest.fn() };
    guard = new BetterAuthGuard(
      em as unknown as EntityManager,
      usersService as unknown as UsersService,
      new Reflector(),
    );

    getSession.mockResolvedValue({
      user: { email: 'user@example.com' },
      activeOrganizationId: ORG_ID,
    });
    usersService.findOneByEmail.mockResolvedValue({
      id: 'user-1',
      isSuperAdmin: false,
    });
  });

  it('rejects when there is no active session', async () => {
    getSession.mockResolvedValue(null);
    await expect(
      guard.canActivate(buildContext(handlerRequiring({}))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the role matches but a required permission is missing', async () => {
    // Regression test: a matching role must NOT bypass a missing permission.
    getAuthContextMock.mockResolvedValue({
      membership: { id: 'm-1' },
      persona: null,
      roles: [{ name: SystemRole.ORG_ADMIN }],
      permissions: [],
    });

    await expect(
      guard.canActivate(
        buildContext(
          handlerRequiring({
            roles: [SystemRole.ORG_ADMIN],
            perms: ['TIMESHEET_WRITE'],
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when the permission matches but no required role is held', async () => {
    // Regression test: a matching permission must NOT bypass a missing role.
    getAuthContextMock.mockResolvedValue({
      membership: { id: 'm-1' },
      persona: null,
      roles: [{ name: SystemRole.EMPLOYEE }],
      permissions: ['TIMESHEET_WRITE'],
    });

    await expect(
      guard.canActivate(
        buildContext(
          handlerRequiring({
            roles: [SystemRole.ORG_ADMIN],
            perms: ['TIMESHEET_WRITE'],
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows when both the required role and permission are held', async () => {
    getAuthContextMock.mockResolvedValue({
      membership: { id: 'm-1' },
      persona: null,
      roles: [{ name: SystemRole.ORG_ADMIN }],
      permissions: ['TIMESHEET_WRITE'],
    });

    const ok = await guard.canActivate(
      buildContext(
        handlerRequiring({
          roles: [SystemRole.ORG_ADMIN],
          perms: ['TIMESHEET_WRITE'],
        }),
      ),
    );
    expect(ok).toBe(true);
  });

  it('lets SuperAdmin bypass every check', async () => {
    usersService.findOneByEmail.mockResolvedValue({
      id: 'user-1',
      isSuperAdmin: true,
    });
    getAuthContextMock.mockResolvedValue({
      membership: { id: 'm-1' },
      persona: null,
      roles: [],
      permissions: [],
    });

    const ok = await guard.canActivate(
      buildContext(
        handlerRequiring({
          roles: [SystemRole.ORG_OWNER],
          perms: ['TIMESHEET_WRITE'],
        }),
      ),
    );
    expect(ok).toBe(true);
  });
});
