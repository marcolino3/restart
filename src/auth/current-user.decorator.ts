import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@/users/entities/user.entity';

type RequestWithUser = {
  user: User;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      return req.user;
    }

    if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const req = gqlContext.getContext().req as RequestWithUser;
      return req.user;
    }

    throw new Error('Unsupported context type');
  },
);
