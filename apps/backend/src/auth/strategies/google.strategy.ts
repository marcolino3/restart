import { UsersService } from '@/users/users.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { AuthAccountsService } from '@/auth-accounts/auth-accounts.service';
import { AuthProvider } from '@/auth-accounts/interfaces/auth-provider.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly userEmailsService: UserEmailsService,
    private readonly authAccountsService: AuthAccountsService,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_AUTH_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_AUTH_REDIRECT_URI'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: import('passport-google-oauth20').Profile,
  ) {
    const email = profile.emails?.[0]?.value as string;
    const googleId = profile.id;

    // 1) Existiert bereits ein AuthAccount fuer diesen Google-Provider?
    const existing = await this.authAccountsService.findByProviderAndId(
      AuthProvider.GOOGLE,
      googleId,
    );
    if (existing) {
      const userEmail = await this.userEmailsService.findOne(
        existing.userEmailId,
      );
      return this.usersService.findOne(userEmail.userId);
    }

    // 2) Existiert eine UserEmail mit dieser Adresse? -> Auto-Link
    try {
      const userEmail = await this.userEmailsService.findByEmail(email);
      await this.authAccountsService.linkProvider(
        userEmail.id,
        AuthProvider.GOOGLE,
        googleId,
      );
      return this.usersService.findOne(userEmail.userId);
    } catch {
      // Email nicht gefunden
    }

    // 3) Kein Account vorhanden -> Zugang verweigert
    throw new UnauthorizedException(
      'No account found for this Google email. Please register first.',
    );
  }
}
