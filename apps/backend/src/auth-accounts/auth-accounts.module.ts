import { Module } from '@nestjs/common';
import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccountsResolver } from './auth-accounts.resolver';

@Module({
  providers: [AuthAccountsResolver, AuthAccountsService],
})
export class AuthAccountsModule {}
