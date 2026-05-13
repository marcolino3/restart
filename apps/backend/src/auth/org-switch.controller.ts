import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type { Request, Response } from 'express';
import { EntityManager } from 'typeorm';

import { ACTIVE_ORG_COOKIE, auth } from '@/lib/auth';
import { Membership } from '@/memberships/entities/membership.entity';
import { UsersService } from '@/users/users.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sets the Active-Org cookie that the better-auth customSession plugin
 * (apps/backend/src/lib/auth.ts) surfaces on session.activeOrganizationId.
 *
 * Lives at /api/org/switch (NOT /api/auth/*) because better-auth owns the
 * /api/auth/* namespace.
 */
@Controller('org')
export class OrgSwitchController {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly usersService: UsersService,
  ) {}

  @Post('switch')
  async switch(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('orgId') orgId: string,
  ) {
    if (!orgId || !UUID_RE.test(orgId)) {
      throw new BadRequestException('Invalid orgId');
    }

    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });
    if (!session?.user) {
      throw new UnauthorizedException('No active session');
    }

    const user = await this.usersService
      .findOneByEmail(session.user.email)
      .catch(() => null);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isSuperAdmin) {
      const membership = await this.em.findOne(Membership, {
        where: { userId: user.id, organizationId: orgId },
      });
      if (!membership) {
        throw new ForbiddenException('No membership in this organization');
      }
    }

    res.cookie(ACTIVE_ORG_COOKIE, orgId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      // 30 days
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return { success: true };
  }

  @Post('clear')
  async clear(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACTIVE_ORG_COOKIE, { path: '/' });
    return { success: true };
  }
}
