import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenPayload } from '../interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
};
export const CurrentOrgId = createParamDecorator(
  (_d, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>();
    return gqlCtx.req.user?.orgId ?? null;
  },
);
