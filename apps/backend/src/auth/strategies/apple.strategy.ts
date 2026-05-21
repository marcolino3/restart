import { UsersService } from '@/users/users.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { AuthAccountsService } from '@/auth-accounts/auth-accounts.service';
import { AuthProvider } from '@/auth-accounts/interfaces/auth-provider.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import AppleStrategy from 'passport-apple';
import { decode } from 'jsonwebtoken';

@Injectable()
export class AppleAuthStrategy extends PassportStrategy(
  AppleStrategy,
  'apple',
) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly userEmailsService: UserEmailsService,
    private readonly authAccountsService: AuthAccountsService,
  ) {
    super({
      clientID: configService.getOrThrow('APPLE_AUTH_CLIENT_ID'),
      teamID: configService.getOrThrow('APPLE_AUTH_TEAM_ID'),
      keyID: configService.getOrThrow('APPLE_AUTH_KEY_ID'),
      privateKeyString: configService
        .getOrThrow<string>('APPLE_AUTH_PRIVATE_KEY')
        .replace(/\\n/g, '\n'),
      callbackURL: configService.getOrThrow('APPLE_AUTH_REDIRECT_URI'),
      passReqToCallback: false,
      scope: ['name', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: string,
    _profile: AppleStrategy.Profile,
    done: AppleStrategy.VerifyCallback,
  ) {
    try {
      const decoded = decode(idToken) as {
        sub: string;
        email?: string;
      } | null;

      if (!decoded?.sub) {
        return done(new UnauthorizedException('Invalid Apple ID token'));
      }

      const appleId = decoded.sub;
      const email = decoded.email;

      // 1) Existiert bereits ein AuthAccount fuer diesen Apple-Provider?
      const existing = await this.authAccountsService.findByProviderAndId(
        AuthProvider.APPLE,
        appleId,
      );
      if (existing) {
        const userEmail = await this.userEmailsService.findOne(
          existing.userEmailId,
        );
        const user = await this.usersService.findOne(userEmail.userId);
        return done(null, user);
      }

      // 2) Existiert eine UserEmail mit dieser Adresse? -> Auto-Link
      if (email) {
        try {
          const userEmail = await this.userEmailsService.findByEmail(email);
          await this.authAccountsService.linkProvider(
            userEmail.id,
            AuthProvider.APPLE,
            appleId,
          );
          const user = await this.usersService.findOne(userEmail.userId);
          return done(null, user);
        } catch {
          // Email nicht gefunden
        }
      }

      // 3) Kein Account vorhanden -> Zugang verweigert
      return done(
        new UnauthorizedException(
          'No account found for this Apple ID. Please register first.',
        ),
      );
    } catch (err) {
      return done(err as Error);
    }
  }
}
