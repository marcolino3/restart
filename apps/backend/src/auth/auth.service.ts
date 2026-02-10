// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager, MoreThan } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { MailService } from '@/mail/mail.service';
import { TokenPayload } from './interfaces/token-payload.interface';
import { getAuthContext } from './utils/get-auth-context.util';
import { SafeUser } from './interfaces/safe-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Username/Password Login: validiert User und liefert den User zurueck.
   * Laedt passwordHash via select, da in der Entity select:false gesetzt ist.
   */

  async verifyUser(email: string, password: string): Promise<SafeUser> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.entityManager.findOne(User, {
      where: { email: normalizedEmail, isActive: true },
      // passwordHash explizit mitladen
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'passwordHash',
        'isSuperAdmin',
      ],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException();
    }

    const ok = await compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException();
    }

    // Hash entfernen, dann typisieren
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user as User & { passwordHash: string };
    return safe as SafeUser;
  }

  /**
   * Validiert den Refresh-Token gegen den in der DB gespeicherten Hash.
   * Laedt refreshToken via select, da in der Entity select:false gesetzt ist.
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
   * und setzt beide als Cookies. Baut das Access-Payload aus dem AuthContext.
   */
  // auth.service.ts (Ausschnitt)
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
      membershipId: ctx.membership.id,
      persona: ctx.membership.persona,
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

    console.log('NODE_ENV', this.configService.getOrThrow('NODE_ENV'));
    console.log('secure?', prod);

    // Tokens
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + accessMs),
    });
    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/auth/refresh',
      expires: new Date(Date.now() + refreshMs),
    });

    // Active Org zentral hier setzen
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
    // 1) org-freies Access-Token fuer SuperAdmin
    const accessMs = parseInt(
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
      10,
    );
    const accessToken = this.jwtService.sign(
      { sub: user.id, isSuperAdmin: true }, // keine orgId, nur SA-Flag
      {
        secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
        // du wolltest ohne maxAge arbeiten -> also expires als Dauer
        expiresIn: `${Math.floor(accessMs / 1000)}s`,
      },
    );

    // 2) Refresh-Token wie gehabt
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

    console.log('NODE_ENV', this.configService.getOrThrow('NODE_ENV'));
    console.log('secure?', prod);

    // 3) Cookies setzen (ohne Active-Org)
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + accessMs),
    });

    res.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + refreshMs),
    });

    // 4) Redirect auf Dashboard
    res.redirect(
      `${this.configService.getOrThrow('AUTH_UI_REDIRECT')}/de/admin/my-time-tracking`,
    );
  }

  /**
   * Erzeugt einen Magic-Link-Token, speichert den Hash in der DB und sendet die Email.
   * Gibt keinen Fehler zurueck, wenn die Email nicht existiert (Sicherheit).
   */
  async sendMagicLink(email: string): Promise<void> {
    let user: User;
    try {
      user = await this.usersService.findOneByEmail(email);
    } catch {
      // User nicht gefunden -> kein Fehler nach aussen (kein Email-Leak)
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten

    await this.usersService.setMagicLinkToken(user.id, tokenHash, expiresAt);

    const baseUrl = this.configService.getOrThrow('AUTH_UI_REDIRECT');
    const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}`;

    // TODO: Remove console.log once SMTP is configured
    console.log(`[Magic Link] ${user.email} → ${magicLinkUrl}`);

    try {
      await this.mailService.sendMagicLinkEmail(
        user.email,
        user.firstName,
        magicLinkUrl,
      );
    } catch (err) {
      console.error('Failed to send magic link email:', err);
    }
  }

  /**
   * Verifiziert einen Magic-Link-Token: hasht ihn, sucht in der DB, loescht den Token.
   */
  async verifyMagicLink(token: string): Promise<User> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.entityManager.findOne(User, {
      where: {
        magicLinkToken: tokenHash,
        magicLinkExpiresAt: MoreThan(new Date()),
      },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isSuperAdmin',
        'magicLinkToken',
        'magicLinkExpiresAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    await this.usersService.clearMagicLinkToken(user.id);

    return user;
  }

  /**
   * Optional: loescht Cookies und invalidiert den gespeicherten Refresh-Token.
   */
  async logout(userId: string, response: Response): Promise<void> {
    // Refresh-Token in DB entfernen (bzw. auf null setzen)
    await this.usersService.clearRefreshToken(userId);
    const prod = this.configService.get('NODE_ENV') === 'production';

    response.clearCookie('Authentication', {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });

    response.clearCookie('Refresh', {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });
  }
}
