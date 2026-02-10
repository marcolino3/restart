import { Injectable } from '@nestjs/common';
import { CreateAuthAccountInput } from './dto/create-auth-account.input';
import { UpdateAuthAccountInput } from './dto/update-auth-account.input';

@Injectable()
export class AuthAccountsService {
  create(_createAuthAccountInput: CreateAuthAccountInput) {
    return 'This action adds a new authAccount';
  }

  findAll() {
    return `This action returns all authAccounts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authAccount`;
  }

  update(id: number, _updateAuthAccountInput: UpdateAuthAccountInput) {
    return `This action updates a #${id} authAccount`;
  }

  remove(id: number) {
    return `This action removes a #${id} authAccount`;
  }
}
