import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminOnly } from '@/auth/decorators/super-admin.decorator';
import { UserEmail } from './entities/user-email.entity';
import { UserEmailsService } from './user-emails.service';

@Resolver(() => UserEmail)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class UserEmailsResolver {
  constructor(private readonly userEmailsService: UserEmailsService) {}

  @Query(() => [UserEmail], { name: 'userEmailsByUserId' })
  findByUserId(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: TokenPayload,
  ) {
    this.assertOwner(userId, actor);
    return this.userEmailsService.findByUserId(userId);
  }

  @Query(() => UserEmail, { name: 'userEmail' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() actor: TokenPayload,
  ) {
    const email = await this.userEmailsService.findOne(id);
    this.assertOwner(email.userId, actor);
    return email;
  }

  private assertOwner(userId: string, actor: TokenPayload) {
    if (!actor?.isSuperAdmin && (!actor?.sub || actor.sub !== userId)) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Mutation(() => UserEmail, { name: 'addUserEmail' })
  @SuperAdminOnly()
  addUserEmail(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('email', { type: () => String }) email: string,
  ) {
    return this.userEmailsService.create(userId, email);
  }

  @Mutation(() => UserEmail, { name: 'setPrimaryUserEmail' })
  @SuperAdminOnly()
  setPrimaryUserEmail(@Args('id', { type: () => ID }) id: string) {
    return this.userEmailsService.setPrimary(id);
  }

  @Mutation(() => UserEmail, { name: 'removeUserEmail' })
  @SuperAdminOnly()
  removeUserEmail(@Args('id', { type: () => ID }) id: string) {
    return this.userEmailsService.remove(id);
  }
}
