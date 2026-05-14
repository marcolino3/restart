import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccountsResolver } from './auth-accounts.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [AuthAccountsResolver, AuthAccountsService],
  exports: [AuthAccountsService],
})
export class AuthAccountsModule {}
