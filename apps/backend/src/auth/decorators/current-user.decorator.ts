import type { Request } from 'express';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

type HttpReq = Request & { user?: TokenPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<HttpReq>();
      return req.user;
    }
    if (context.getType<'graphql'>() === 'graphql') {
      const gql = GqlExecutionContext.create(context);
      const req = gql.getContext<{ req: HttpReq }>().req;

      return req.user;
    }
    throw new Error('Unsupported context type');
  },
);
