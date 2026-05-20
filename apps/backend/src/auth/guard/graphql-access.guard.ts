// src/auth/guard/graphql-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { SUPER_ADMIN_KEY } from '@/auth/decorators/super-admin.decorator';
import { ADMIN_PERSONA_KEY } from '@/auth/decorators/admin-persona-only.decorator';
import {
  isAdminPersona,
  requiresAdminPersona,
} from '@/auth/constants/admin-persona.const';
import { SystemRole } from '@/roles/entities/system-role.enum';
import type { Request } from 'express';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
};

@Injectable()
export class GraphQLAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    // Nichts gefordert -> ok
    if (
      !superAdminOnly &&
      !adminPersonaOnly &&
      rolesReq.length === 0 &&
      permsReq.length === 0
    )
      return true;

    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>();
    const user = gqlCtx.req.user;
    if (user?.isSuperAdmin) return true;

    if (superAdminOnly)
      throw new ForbiddenException('SuperAdmin only');

    if (!user) throw new ForbiddenException('Unauthenticated');

    // Admin-persona gate for resolvers/endpoints that expose HR-sensitive data
    // (employee detail profile, HR profile, emergency contacts, contracts,
    // audit log, notes). Only ADMIN, HR, OFFICE personas — teachers and other
    // staff personas are blocked even if their role grants EMPLOYEE_READ.
    if (adminPersonaOnly && !isAdminPersona(user.persona)) {
      throw new ForbiddenException('Access denied (admin persona required)');
    }

    const roleOk =
      rolesReq.length === 0 ||
      (Array.isArray(user.roles) &&
        user.roles.some((r) => rolesReq.includes(r as SystemRole)));

    const permOk =
      permsReq.length === 0 ||
      (Array.isArray(user.permissions) &&
        permsReq.every((p) => user.permissions!.includes(p)));

    if (!roleOk && !permOk) {
      throw new ForbiddenException('Access denied (roles/permissions)');
    }

    // Persona hard-block: admin-only permission codes (org/users/teams/roles)
    // require an admin persona (ADMIN, HR, OFFICE). Defense-in-depth on top of
    // the role/permission check above — even if a teacher's role happens to
    // include ROLE_ASSIGN, the persona gate still rejects them.
    if (requiresAdminPersona(permsReq) && !isAdminPersona(user.persona)) {
      throw new ForbiddenException('Access denied (admin persona required)');
    }
    return true;
  }
}
