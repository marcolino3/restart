// src/auth/guard/gql-better-auth.guard.ts
//
// GraphQL guard that authenticates via better-auth (cookie-based session)
// and populates `req.user` with a TokenPayload-compatible object so the
// existing GraphQLAccessGuard / @Permissions() decorator stack continues to
// work unchanged.
//
// Strategy: run BEFORE GraphQLAccessGuard, e.g.
//   @UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
//
// During the migration this can coexist with GqlJwtAuthGuard — resolvers
// using better-auth opt in to this guard; the rest stay on the Passport guard.
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import type { Request } from 'express';

import { auth } from '@/lib/auth';
import { UsersService } from '@/users/users.service';
import { getAuthContext } from '@/auth/utils/get-auth-context.util';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
};

@Injectable()
export class GqlBetterAuthGuard implements CanActivate {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context).getContext<GqlContext>();
    const req = gqlCtx.req;

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });
    if (!session?.user) {
      throw new UnauthorizedException('No active session');
    }

    const dbUser = await this.usersService
      .findOneByEmail(session.user.email)
      .catch(() => null);
    if (!dbUser) {
      throw new UnauthorizedException(
        `No user in domain DB for ${session.user.email}`,
      );
    }

    // Active org is sourced from session.activeOrganizationId (populated by
    // the customSession plugin in apps/backend/src/lib/auth.ts from the
    // Active-Org cookie). If absent, the request still passes auth but with
    // empty roles/permissions — @Permissions() / @SuperAdminOnly() guards
    // downstream will reject any org-scoped query, while the unprotected
    // `authContext` query stays reachable so the frontend can route the user
    // to /select-org.
    const orgId = session.activeOrganizationId ?? undefined;

    let payload: TokenPayload;
    if (orgId) {
      const ctx = await getAuthContext(this.em, dbUser.id, orgId);
      payload = {
        sub: dbUser.id,
        orgId,
        membershipId: ctx.membership?.id,
        persona: ctx.persona ?? undefined,
        roles: ctx.roles
          .map((r) => r.name)
          .filter((n): n is string => Boolean(n)),
        permissions: ctx.permissions,
        isSuperAdmin: dbUser.isSuperAdmin,
      };
    } else {
      payload = {
        sub: dbUser.id,
        isSuperAdmin: dbUser.isSuperAdmin,
        roles: [],
        permissions: [],
      };
    }

    req.user = payload;
    return true;
  }
}
