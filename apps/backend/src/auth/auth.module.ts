import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OrgSwitchController } from './org-switch.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '@/users/users.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AppleAuthStrategy } from './strategies/apple.strategy';
import { OrganizationsModule } from '@/organizations/organizations.module';
import { MailModule } from '@/mail/mail.module';
import { SuperAdminBootstrapService } from './super-admin-bootstrap.service';
import { UserEmailsModule } from '@/user-emails/user-emails.module';
import { AuthAccountsModule } from '@/auth-accounts/auth-accounts.module';

const appleProviders = process.env.APPLE_AUTH_CLIENT_ID
  ? [AppleAuthStrategy]
  : [];

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    UserEmailsModule,
    AuthAccountsModule,
    OrganizationsModule,
    MailModule,
  ],
  controllers: [AuthController, OrgSwitchController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    ...appleProviders,
    SuperAdminBootstrapService,
  ],
  exports: [],
})
export class AuthModule {}
