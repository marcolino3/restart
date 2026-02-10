import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { AuthContextOutput } from './dto/auth-context.output';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  @Permissions('USER_INVITE')
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
      isSuperAdmin: user.isSuperAdmin ?? false,
    };
  }

  @Query(() => [User], { name: 'users' })
  @Permissions('EMPLOYEE_READ')
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  @Permissions('EMPLOYEE_WRITE')
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => User)
  @Permissions('USER_REMOVE')
  removeUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }
}
