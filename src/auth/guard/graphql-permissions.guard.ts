import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import type { Request } from 'express';

type GqlContext = {
  req: Request & { user?: RequestUser };
};

@Injectable()
export class GraphQLPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (required.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>(); // getypter Context statt any
    const user = gqlCtx.req.user; // kein unsicherer Zugriff mehr
    if (user?.isSuperAdmin) return true;

    if (!user?.permissions || user.permissions.length === 0) {
      throw new ForbiddenException('Missing permissions');
    }

    const hasAll = required.every((p) => user.permissions!.includes(p));
    if (!hasAll) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
