import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { EntityManager } from 'typeorm';
import { Membership } from '@/memberships/entities/membership.entity';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

type GqlContext = {
  req: Request & { user?: TokenPayload };
  entityManager: EntityManager;
};

export const CurrentMembership = createParamDecorator(
  async (_data: unknown, context: ExecutionContext): Promise<Membership> => {
    let gqlContext: GqlContext;

    if (context.getType<'graphql'>() === 'graphql') {
      gqlContext = GqlExecutionContext.create(context).getContext();
    } else {
      throw new Error(
        'CurrentMembership decorator only supports GraphQL context',
      );
    }

    const { req, entityManager } = gqlContext;
    const user = req.user;

    if (!user?.membershipId) {
      throw new Error(`No membershipId in user context`);
    }

    const membership = await entityManager.findOne(Membership, {
      where: {
        id: user.membershipId,
        userId: user.sub,
        isActive: true,
        isArchived: false,
      },
      relations: ['user', 'organization', 'roles', 'employee'],
    });

    if (!membership) {
      throw new Error(`Membership not found for ID ${user.membershipId}`);
    }

    return membership;
  },
);
