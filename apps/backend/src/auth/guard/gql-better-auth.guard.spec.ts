import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { EntityManager } from 'typeorm';

import { GqlBetterAuthGuard } from './gql-better-auth.guard';
import { auth } from '@/lib/auth';
import { getAuthContext } from '@/auth/utils/get-auth-context.util';
import { UsersService } from '@/users/users.service';

jest.mock('@/lib/auth', () => ({
  auth: { api: { getSession: jest.fn() } },
}));
jest.mock('@/auth/utils/get-auth-context.util', () => ({
  getAuthContext: jest.fn(),
}));

const getSession = auth.api.getSession as unknown as jest.Mock;
const getAuthContextMock = getAuthContext as unknown as jest.Mock;

describe('GqlBetterAuthGuard', () => {
  const STALE_ORG_ID = 'abd5fe7f-7b3c-4cc2-a81a-dc973a76ee8f';

  let em: { existsBy: jest.Mock };
  let usersService: { findOneByEmail: jest.Mock };
  let guard: GqlBetterAuthGuard;
  let req: { headers: Record<string, string>; user?: unknown };

  const buildContext = (): ExecutionContext => {
    const gqlCtx = { req };
    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({ getContext: () => gqlCtx } as never);
    return {} as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    em = { existsBy: jest.fn() };
    usersService = { findOneByEmail: jest.fn() };
    guard = new GqlBetterAuthGuard(
      em as unknown as EntityManager,
      usersService as unknown as UsersService,
    );
  });

  it('rejects when there is no active session', async () => {
    getSession.mockResolvedValue(null);
    await expect(guard.canActivate(buildContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // Regression: a stale Active-Org cookie (org deleted / DB reseeded) must NOT
  // crash the request with a 500. The guard has to degrade to the empty-roles
  // payload so the unprotected `authContext` query stays reachable and the
  // frontend can route the user to /select-org.
  it('degrades to no-org payload when the active org no longer exists', async () => {
    getSession.mockResolvedValue({
      user: { email: 'user@example.com' },
      activeOrganizationId: STALE_ORG_ID,
    });
    usersService.findOneByEmail.mockResolvedValue({
      id: 'user-1',
      isSuperAdmin: false,
    });
    em.existsBy.mockResolvedValue(false); // org gone

    const ok = await guard.canActivate(buildContext());

    expect(ok).toBe(true);
    expect(getAuthContextMock).not.toHaveBeenCalled();
    expect(req.user).toEqual({
      sub: 'user-1',
      isSuperAdmin: false,
      roles: [],
      permissions: [],
    });
  });

  it('populates full org context when the active org exists', async () => {
    getSession.mockResolvedValue({
      user: { email: 'user@example.com' },
      activeOrganizationId: STALE_ORG_ID,
    });
    usersService.findOneByEmail.mockResolvedValue({
      id: 'user-1',
      isSuperAdmin: false,
    });
    em.existsBy.mockResolvedValue(true);
    getAuthContextMock.mockResolvedValue({
      membership: { id: 'm-1' },
      persona: null,
      roles: [{ name: 'TEACHER' }],
      permissions: ['STUDENT_READ'],
    });

    const ok = await guard.canActivate(buildContext());

    expect(ok).toBe(true);
    expect(getAuthContextMock).toHaveBeenCalledWith(em, 'user-1', STALE_ORG_ID);
    expect(req.user).toMatchObject({
      sub: 'user-1',
      orgId: STALE_ORG_ID,
      membershipId: 'm-1',
      roles: ['TEACHER'],
      permissions: ['STUDENT_READ'],
    });
  });
});
