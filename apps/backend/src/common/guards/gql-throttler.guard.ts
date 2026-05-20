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

  // SSR sammelt alle Server-Component-Queries einer Seite unter derselben
  // Loopback-IP — bei aktivem Fast Refresh schlägt das sofort gegen `short:
  // 10/s`. Außerhalb von Production deshalb Localhost vom Limit ausnehmen.
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      return super.shouldSkip(context);
    }
    const { req } = this.getRequestResponse(context);
    const ip =
      (req as { ip?: string; ips?: string[] }).ip ??
      (req as { ips?: string[] }).ips?.[0];
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }
    return super.shouldSkip(context);
  }
}
