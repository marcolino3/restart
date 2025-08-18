import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';

@Injectable()
export class GqlJwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);

    return ctx.getContext<{ req: Request }>().req;
  }
}
