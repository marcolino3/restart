import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { EntityManager } from 'typeorm';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly entityManager: EntityManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request.cookies?.Authentication as string;

          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: TokenPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.entityManager.findOne(User, {
      where: { id: payload.sub, isActive: true },
      select: ['id', 'isSuperAdmin'],
      relations: ['memberships'], // minimal
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const membership = user.memberships?.[0];

    const tokenPayload: TokenPayload = {
      sub: user.id,
      membershipId: payload.membershipId ?? membership?.id,
      orgId: payload.orgId ?? membership?.organizationId,
      isSuperAdmin: user.isSuperAdmin,
      persona: payload.persona ?? membership?.persona,
      roles: payload.roles,
      permissions: payload.permissions,
    };

    return tokenPayload;
  }
}
