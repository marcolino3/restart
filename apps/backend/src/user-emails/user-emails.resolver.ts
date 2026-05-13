import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { UserEmail } from './entities/user-email.entity';
import { UserEmailsService } from './user-emails.service';

@Resolver(() => UserEmail)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class UserEmailsResolver {
  constructor(private readonly userEmailsService: UserEmailsService) {}

  @Query(() => [UserEmail], { name: 'userEmailsByUserId' })
  findByUserId(@Args('userId', { type: () => ID }) userId: string) {
    return this.userEmailsService.findByUserId(userId);
  }

  @Query(() => UserEmail, { name: 'userEmail' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.userEmailsService.findOne(id);
  }

  @Mutation(() => UserEmail)
  removeUserEmail(@Args('id', { type: () => ID }) id: string) {
    return this.userEmailsService.remove(id);
  }
}
