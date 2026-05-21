import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
};

/**
 * Resolves `req.user.membershipId` as `string | null` without throwing.
 *
 * Use for audit-log / actor-tracking parameters where a SuperAdmin (or a user
 * not yet bound to an org membership) should still be able to perform the
 * mutation — `null` is acceptable instead of a hard failure.
 */
export const CurrentMembershipIdOptional = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => {
    if (context.getType<'graphql'>() !== 'graphql') {
      throw new Error(
        'CurrentMembershipIdOptional decorator only supports GraphQL context',
      );
    }
    const { req } =
      GqlExecutionContext.create(context).getContext<GqlContext>();
    return req.user?.membershipId ?? null;
  },
);
