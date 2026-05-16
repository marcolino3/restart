import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

// Default ThrottlerGuard erwartet `req`/`res` direkt vom HTTP-Context. Bei
// GraphQL liefert `context.switchToHttp().getRequest()` aber den GraphQL-
// Resolver-Context (ohne `ip`), wodurch `getTracker` mit
// `Cannot read properties of undefined (reading 'ip')` crasht.
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context).getContext<{
        req: Record<string, unknown>;
        res: Record<string, unknown>;
      }>();
      return { req: gqlCtx.req, res: gqlCtx.res };
    }
    return super.getRequestResponse(context);
  }
}
