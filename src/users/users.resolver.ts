import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
@UseGuards(GqlJwtAuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => User, { name: 'currentUser' })
  currentUser(@CurrentUser() user: User) {
    return this.usersService.findCurrentUser(user.id);
  }

  @Query(() => [User], { name: 'users' })
  @UseGuards()
  @Roles(SystemRole.ORG_ADMIN) // optional
  @Permissions('EMPLOYEE_WRITE', 'TEAM_MANAGE') // optional
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }
}
