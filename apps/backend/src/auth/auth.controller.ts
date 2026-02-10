// src/auth/auth.controller.ts
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { JwtRefreshAuthGuard } from './guard/jwt-refresh-auth.guard';
import { GoogleAuthGuard } from './guard/google-auth.guard';

import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { OrganizationsService } from '@/organizations/organizations.service';
import { UsersService } from '@/users/users.service';
import { TokenPayload } from './interfaces/token-payload.interface';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

// Typsicherer Request (req.user vom Jwt(Refresh)Strategy, Cookies via cookie-parser)
type AuthenticatedRequest = Request & {
  user?: TokenPayload;
  cookies: Record<string, string>;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Username/Password Login
   * - org ueber Host (Subdomain) ableiten
   * - Access + Refresh Cookies setzen
   * - Active-Org Cookie setzen (fuer org-neutralen Refresh)
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const host = req.hostname ?? '';
    const isLocal =
      host === 'localhost' || host === '127.0.0.1' || host === '::1';

    let orgSlug: string | undefined;
    if (!isLocal) {
      orgSlug = host.split('.')[0];
    } else {
      orgSlug =
        (typeof req.headers['x-org-slug'] === 'string'
          ? req.headers['x-org-slug'].trim()
          : undefined) ||
        (typeof req.query['org'] === 'string'
          ? req.query['org'].trim()
          : undefined);
    }

    // ✅ Superadmin darf ohne Org einloggen -> nur Refresh setzen
    // if (!orgSlug && user.isSuperAdmin) {
    //   const { accessToken } = await this.authService.loginRefreshOnly(
    //     user,
    //     res,
    //   );

    //   return {
    //     success: true,
    //     needsOrgSelection: true,
    //     accessToken, // <-- hier kannst du es fuer Apollo Studio rauskopieren
    //   };
    // }

    // Bisheriges Verhalten fuer alle anderen
    if (!orgSlug) {
      throw new BadRequestException(
        'Org nicht gefunden: subdomain oder x-org-slug Header oder ?org=... setzen',
      );
    }

    const org = await this.organizationsService.findBySlug(orgSlug);
    await this.authService.login(user, res, org.id);
    return { success: true };
  }

  /**
   * Refresh
   * - JwtRefreshAuthGuard validiert Refresh-Token -> req.user.sub
   * - orgId aus Active-Org Cookie lesen
   * - neues Access-Token fuer diese Org ausstellen
   */
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = req.user;
    if (!payload?.sub) throw new BadRequestException('Invalid refresh payload');

    const orgId = req.cookies['Active-Org'] as string;
    if (!orgId) throw new BadRequestException('No active org selected');

    const user = await this.usersService.findOne(payload.sub);
    await this.authService.login(user, res, orgId);
    return { success: true };
  }

  /**
   * Google OAuth Start
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  loginGoogle() {
    // wird von Passport gestartet
  }

  /**
   * Google OAuth Callback
   * - CurrentUser kommt aus GoogleAuthGuard
   * - org ueber Host (Subdomain) ableiten
   * - setzt Active-Org und stellt org-spezifische Session her
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedRequest,
  ) {
    const host = req.hostname;
    const orgSlug = host.split('.')[0];

    // ✅ Superadmin darf ohne Org einloggen -> nur Refresh setzen
    if (user.isSuperAdmin) {
      await this.authService.loginRefreshOnly(user, res);
      return;
    }
    const userWithMembership = await this.usersService.findCurrentUser(user.id);
    const orgId = userWithMembership?.memberships[0].organizationId;
    // const org = await this.organizationsService.findBySlug(orgSlug);

    if (!orgId) throw new ConflictException('No Organization found.');
    await this.authService.login(user, res, orgId, true);
  }

  /**
   * Org-Wechsel
   * - erfordert gueltigen Refresh (User eingeloggt)
   * - setzt Active-Org Cookie
   * - stellt org-spezifisches Access-Token aus
   */
  @Post('switch-org')
  @UseGuards(JwtAuthGuard)
  async switchOrg(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Body('orgId') orgId: string,
  ) {
    const payload = req.user;
    if (!payload?.sub) throw new BadRequestException('Invalid refresh payload');

    // Optional: Membership pruefen (user darf diese Org waehlen)
    // z. B. membershipsService.assertUserInOrg(payload.sub, orgId);

    const user = await this.usersService.findOne(payload.sub);
    await this.authService.login(user, res, orgId);
    return { success: true };
  }

  /**
   * Magic Link senden
   * - gibt immer { success: true } zurueck (kein Email-Leak)
   */
  @Post('magic-link/send')
  async sendMagicLink(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    await this.authService.sendMagicLink(email);
    return { success: true };
  }

  /**
   * Magic Link verifizieren
   * - Token aus Query, User laden, login mit redirect
   */
  @Get('magic-link/verify')
  async verifyMagicLink(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    const user = await this.authService.verifyMagicLink(token);
    const userWithMembership = await this.usersService.findCurrentUser(user.id);

    if (user.isSuperAdmin) {
      await this.authService.loginRefreshOnly(user, res);
      return;
    }

    const orgId = userWithMembership?.memberships[0]?.organizationId;
    if (!orgId) throw new ConflictException('No Organization found.');

    await this.authService.login(user, res, orgId, true);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: TokenPayload,
  ) {
    await this.authService.logout(user.sub, res);
    return { success: true };
  }
}
