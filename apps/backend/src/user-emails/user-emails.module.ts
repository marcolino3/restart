import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { UserEmailsService } from './user-emails.service';
import { UserEmailsResolver } from './user-emails.resolver';

@Module({
  imports: [DatabaseModule],
  providers: [UserEmailsResolver, UserEmailsService],
  exports: [UserEmailsService],
})
export class UserEmailsModule {}
