// REST guard: better-auth session → req.user (TokenPayload) + permission check.
// Equivalent to GqlBetterAuthGuard + GraphQLAccessGuard combined for non-GraphQL routes.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectEntityManager } from '@nestjs/typeorm';
import type { Request } from 'express';
import { EntityManager } from 'typeorm';

import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { SUPER_ADMIN_KEY } from '@/auth/decorators/super-admin.decorator';
import { ADMIN_PERSONA_KEY } from '@/auth/decorators/admin-persona-only.decorator';
import {
  isAdminPersona,
  requiresAdminPersona,
} from '@/auth/constants/admin-persona.const';
import { getAuthContext } from '@/auth/utils/get-auth-context.util';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { auth } from '@/lib/auth';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { UsersService } from '@/users/users.service';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: TokenPayload }>();

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

    const handlers = [context.getHandler(), context.getClass()];
    const superAdminOnly =
      this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, handlers) ??
      false;
    const adminPersonaOnly =
      this.reflector.getAllAndOverride<boolean>(ADMIN_PERSONA_KEY, handlers) ??
      false;
    const rolesReq =
      this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, handlers) ?? [];
    const permsReq =
      this.reflector.getAllAndOverride<string[]>(PERMS_KEY, handlers) ?? [];

    if (
      !superAdminOnly &&
      !adminPersonaOnly &&
      rolesReq.length === 0 &&
      permsReq.length === 0
    ) {
      return true;
    }
    if (payload.isSuperAdmin) return true;
    if (superAdminOnly) throw new ForbiddenException('SuperAdmin only');
    if (adminPersonaOnly && !isAdminPersona(payload.persona)) {
      throw new ForbiddenException('Access denied (admin persona required)');
    }

    const roleOk =
      rolesReq.length === 0 ||
      (Array.isArray(payload.roles) &&
        payload.roles.some((r) => rolesReq.includes(r as SystemRole)));
    const permOk =
      permsReq.length === 0 ||
      (Array.isArray(payload.permissions) &&
        permsReq.every((p) => payload.permissions!.includes(p)));

    if (!roleOk && !permOk) {
      throw new ForbiddenException('Access denied (roles/permissions)');
    }

    if (requiresAdminPersona(permsReq) && !isAdminPersona(payload.persona)) {
      throw new ForbiddenException('Access denied (admin persona required)');
    }
    return true;
  }
}
