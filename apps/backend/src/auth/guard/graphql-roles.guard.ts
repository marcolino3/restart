import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import type { Request } from 'express';

type GqlContext = {
  req: Request & { user?: RequestUser };
};

@Injectable()
export class GraphQLRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    // Kein Rollen-Requirement -> Zugriff erlauben
    if (required.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>(); // <-- getypter Context
    const user = gqlCtx.req.user; // <-- kein any mehr
    if (user?.isSuperAdmin) return true;

    if (!user?.roles || user.roles.length === 0) {
      throw new ForbiddenException('Missing roles');
    }

    const ok = user.roles.some((role) => required.includes(role as SystemRole));
    if (!ok) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
