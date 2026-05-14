import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { DatabaseModule } from '@/database/database.module';
import { PasswordService } from './password.service';
import { UserEmailsModule } from '@/user-emails/user-emails.module';

// Global so GqlBetterAuthGuard (lives in @Global() BetterAuthModule) can be
// instantiated from any resolver's module context without forcing every
// downstream module to import UsersModule explicitly.
@Global()
@Module({
  imports: [DatabaseModule, UserEmailsModule],
  providers: [UsersResolver, UsersService, PasswordService],
  exports: [UsersService, PasswordService],
})
export class UsersModule {}
