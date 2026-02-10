import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccount } from './entities/auth-account.entity';
import { CreateAuthAccountInput } from './dto/create-auth-account.input';
import { UpdateAuthAccountInput } from './dto/update-auth-account.input';

@Resolver(() => AuthAccount)
export class AuthAccountsResolver {
  constructor(private readonly authAccountsService: AuthAccountsService) {}

  @Mutation(() => AuthAccount)
  createAuthAccount(@Args('createAuthAccountInput') createAuthAccountInput: CreateAuthAccountInput) {
    return this.authAccountsService.create(createAuthAccountInput);
  }

  @Query(() => [AuthAccount], { name: 'authAccounts' })
  findAll() {
    return this.authAccountsService.findAll();
  }

  @Query(() => AuthAccount, { name: 'authAccount' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.authAccountsService.findOne(id);
  }

  @Mutation(() => AuthAccount)
  updateAuthAccount(@Args('updateAuthAccountInput') updateAuthAccountInput: UpdateAuthAccountInput) {
    return this.authAccountsService.update(updateAuthAccountInput.id, updateAuthAccountInput);
  }

  @Mutation(() => AuthAccount)
  removeAuthAccount(@Args('id', { type: () => Int }) id: number) {
    return this.authAccountsService.remove(id);
  }
}
