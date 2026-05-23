import { Module } from '@nestjs/common';
import { OrgSwitchController } from './org-switch.controller';
import { UsersModule } from '@/users/users.module';
import { OrganizationsModule } from '@/organizations/organizations.module';
import { MailModule } from '@/mail/mail.module';
import { SuperAdminBootstrapService } from './super-admin-bootstrap.service';
import { UserEmailsModule } from '@/user-emails/user-emails.module';
import { AuthAccountsModule } from '@/auth-accounts/auth-accounts.module';

@Module({
  imports: [
    UsersModule,
    UserEmailsModule,
    AuthAccountsModule,
    OrganizationsModule,
    MailModule,
  ],
  controllers: [OrgSwitchController],
  providers: [SuperAdminBootstrapService],
  exports: [],
})
export class AuthModule {}
