// POC-only resolver to verify GqlBetterAuthGuard works end-to-end:
// reads better-auth session cookie, populates req.user via getAuthContext,
// and runs through the existing GraphQLAccessGuard / @Permissions() stack
// unchanged. To be removed once the full migration is done.
import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';

@Resolver()
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class BetterAuthPocResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'currentUserViaBetterAuth' })
  currentUserViaBetterAuth(@CurrentUser() user: TokenPayload) {
    return this.usersService.findCurrentUser(user.sub);
  }
}
