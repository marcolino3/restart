import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gql = GqlExecutionContext.create(context);
    const req = gql.getContext<{
      req: Request & { user?: { id: string; isSuperAdmin: boolean } };
    }>().req;

    if (!req?.user) throw new ForbiddenException('No user in context');
    if (!req.user.isSuperAdmin) throw new ForbiddenException('Only superadmin');

    return true;
  }
}
