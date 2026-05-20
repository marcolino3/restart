import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { SuperAdminOnly } from '@/auth/decorators/super-admin.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { AuthContextOutput } from './dto/auth-context.output';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  @Mutation(() => User)
  @SuperAdminOnly()
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => User, { name: 'currentUser' })
  currentUser(@CurrentUser() user: TokenPayload) {
    return this.usersService.findCurrentUser(user.sub);
  }

  @Query(() => AuthContextOutput, { name: 'authContext' })
  async authContext(
    @CurrentUser() user: TokenPayload,
  ): Promise<AuthContextOutput> {
    const fullUser = await this.usersService.findCurrentUser(user.sub);
    if (!fullUser) throw new NotFoundException('User not found');
    return {
      user: fullUser,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      orgId: user.orgId,
      persona: user.persona,
      isSuperAdmin: user.isSuperAdmin ?? false,
    };
  }

  @Query(() => [User], { name: 'users' })
  @SuperAdminOnly()
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  @SuperAdminOnly()
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  @Permissions('EMPLOYEE_WRITE')
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput);
  }

  /**
   * Translates a Restart `users.id` (UUID) into the corresponding
   * better-auth `user.id` (text). Joins via shared email — the two tables
   * are otherwise independent. SuperAdmin only since the only consumer is
   * the impersonation flow.
   */
  @Query(() => String, { name: 'authUserIdByUserId', nullable: true })
  @SuperAdminOnly()
  async authUserIdByUserId(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<string | null> {
    const rows: Array<{ id: string }> = await this.em.query(
      `SELECT au.id
         FROM "user" au
         INNER JOIN user_emails ue ON LOWER(ue.email) = LOWER(au.email)
         WHERE ue.user_id = $1
         LIMIT 1`,
      [userId],
    );
    return rows[0]?.id ?? null;
  }

  @Mutation(() => User)
  @Permissions('USER_REMOVE')
  removeUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }
}
