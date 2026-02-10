import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { DatabaseModule } from '@/database/database.module';
import { PasswordService } from './password.service';

@Module({
  imports: [DatabaseModule],
  providers: [UsersResolver, UsersService, PasswordService],
  exports: [UsersService, PasswordService],
})
export class UsersModule {}
