import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccount } from './entities/auth-account.entity';

@Resolver(() => AuthAccount)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class AuthAccountsResolver {
  constructor(private readonly authAccountsService: AuthAccountsService) {}

  @Query(() => [AuthAccount], { name: 'authAccountsByUserEmailId' })
  findByUserEmailId(
    @Args('userEmailId', { type: () => ID }) userEmailId: string,
  ) {
    return this.authAccountsService.findByUserEmailId(userEmailId);
  }
}
