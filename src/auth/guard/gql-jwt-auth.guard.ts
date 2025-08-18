// src/auth/guard/gql-jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
};

@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>();
    return gqlCtx.req; // <-- Rueckgabewert ist Request, kein any
  }
}
