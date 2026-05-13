import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { MailService } from '@/mail/mail.service';
import { TokenPayload } from './interfaces/token-payload.interface';
import { getAuthContext } from './utils/get-auth-context.util';
import { SafeUser } from './interfaces/safe-user.type';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from './constants/cookie-names';

@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly userEmailsService: UserEmailsService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Username/Password Login: sucht UserEmail, prueft PW, laedt User.
   */
  async verifyUser(email: string, password: string): Promise<SafeUser> {
    const userEmail = await this.userEmailsService.findByEmailWithPassword(
      email.trim().toLowerCase(),
    );

    if (!userEmail || !userEmail.passwordHash) {
      throw new UnauthorizedException();
    }

    const ok = await compare(password, userEmail.passwordHash);
    if (!ok) {
      throw new UnauthorizedException();
    }

    const user = await this.entityManager.findOne(User, {
      where: { id: userEmail.userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user as SafeUser;
  }

  /**
   * Validiert den Refresh-Token gegen den in der DB gespeicherten Hash.
   */
  async verifyUserRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<User> {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId, isActive: true },
      select: ['id', 'refreshToken'],
    });

    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const ok = await compare(refreshToken, user.refreshToken);
    if (!ok) throw new UnauthorizedException();

    return user;
  }

  /**
   * Erstellt Access/Refresh Tokens, speichert den gehashten Refresh-Token
   * und setzt beide als Cookies.
   */
  async login(
    user: User,
    res: Response,
    orgId: string,
    redirect = false,
  ): Promise<void> {
    const ctx = await getAuthContext(this.entityManager, user.id, orgId);

    const payload: TokenPayload = {
      sub: ctx.user.id,
      orgId: ctx.org.id,
      membershipId: ctx.membership?.id,
      persona: ctx.membership?.persona,
      roles: ctx.roles.map((r) => r.systemCode || ''),
      permissions: ctx.permissions,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
      },
    );

    await this.usersService.setRefreshToken(
      user.id,
      await hash(refreshToken, Number(process.env.BCRYPT_ROUNDS ?? 10)),
    );

    const prod = this.configService.get('NODE_ENV') === 'production';
    const accessMs = parseInt(
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
    );
    const refreshMs = parseInt(
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
    );

    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + accessMs),
    });
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/auth/refresh',
      expires: new Date(Date.now() + refreshMs),
    });

    res.cookie('Active-Org', orgId, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });

    if (redirect) {
      res.redirect(
        `${this.configService.getOrThrow('AUTH_UI_REDIRECT')}/de/admin/my-time-tracking`,
      );
    }
  }

  async loginRefreshOnly(user: User, res: Response): Promise<void> {
    const accessMs = parseInt(
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
      10,
    );
    const accessToken = this.jwtService.sign(
      { sub: user.id, isSuperAdmin: true },
      {
        secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: `${Math.floor(accessMs / 1000)}s`,
      },
    );

    const refreshMs = parseInt(
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
      10,
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: `${Math.floor(refreshMs / 1000)}s`,
      },
    );

    await this.usersService.setRefreshToken(
      user.id,
      await hash(refreshToken, Number(process.env.BCRYPT_ROUNDS ?? 10)),
    );

    const prod = this.configService.get('NODE_ENV') === 'production';

    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + accessMs),
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + refreshMs),
    });

    res.redirect(
      `${this.configService.getOrThrow('AUTH_UI_REDIRECT')}/de/admin/my-time-tracking`,
    );
  }

  /**
   * Magic-Link: Token erzeugen, Hash auf UserEmail speichern, Email senden.
   */
  async sendMagicLink(email: string): Promise<void> {
    let userEmail;
    try {
      userEmail = await this.userEmailsService.findByEmail(email);
    } catch {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.userEmailsService.setMagicLinkToken(
      userEmail.id,
      tokenHash,
      expiresAt,
    );

    const baseUrl = this.configService.getOrThrow<string>('AUTH_UI_REDIRECT');
    const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}`;

    console.log(`[Magic Link] ${userEmail.email} → ${magicLinkUrl}`);

    try {
      await this.mailService.sendMagicLinkEmail(
        userEmail.email,
        '',
        magicLinkUrl,
      );
    } catch (err) {
      console.error('Failed to send magic link email:', err);
    }
  }

  /**
   * Magic-Link verifizieren: hasht Token, sucht UserEmail, laedt User.
   */
  async verifyMagicLink(token: string): Promise<User> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const userEmail =
      await this.userEmailsService.findByMagicLinkToken(tokenHash);

    await this.userEmailsService.clearMagicLinkToken(userEmail.id);

    const user = await this.entityManager.findOne(User, {
      where: { id: userEmail.userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async logout(userId: string, response: Response): Promise<void> {
    await this.usersService.clearRefreshToken(userId);
    const prod = this.configService.get('NODE_ENV') === 'production';

    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });

    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });
  }
}
