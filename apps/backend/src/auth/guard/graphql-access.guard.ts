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
    const rolesReq =
      this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const permsReq =
      this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // Nichts gefordert -> ok
    if (rolesReq.length === 0 && permsReq.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>(); // <-- getypter Context
    const user = gqlCtx.req.user; // <-- kein any mehr
    if (user?.isSuperAdmin) return true;

    if (!user) throw new ForbiddenException('Unauthenticated');

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
    return true;
  }
}
