import { Membership } from '@/memberships/entities/membership.entity';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { EntityManager } from 'typeorm';
import { TokenPayload } from '../interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
};

@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(private readonly entityManager: EntityManager) {}
  async canActivate(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>();
    const user = gqlCtx.req.user as TokenPayload;

    if (!user?.orgId || !user?.membershipId) return false;

    // Harter Check gegen DB (schnell, Index auf orgId/userId/membershipId)
    const exists = await this.entityManager.exists(Membership, {
      where: {
        id: user.membershipId,
        organizationId: user.orgId,
        userId: user.sub,
      },
    });
    return !!exists;
  }
}
