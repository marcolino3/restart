import { User } from '@/users/entities/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './token-payload.interface';
import { Response } from 'express';
import { UsersService } from '@/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly enityManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async verifyUser(email: string, password: string) {
    const user = await this.enityManager.findOne(User, {
      where: {
        email,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isAuthenticated = await compare(password, user.password);

    if (!isAuthenticated) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async verifyUserRefreshToken(refreshToken: string, userId: string) {
    const user = await this.enityManager.findOne(User, {
      where: {
        id: userId,
        isActive: true,
      },
    });

    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const isAuthenticated = await compare(refreshToken, user?.refreshToken);

    if (!isAuthenticated) throw new UnauthorizedException();

    return user;
  }

  async login(user: User, response: Response): Promise<void> {
    // Expires Access Token for Cookie
    const expiresAccessToken = new Date();

    expiresAccessToken.setMilliseconds(
      expiresAccessToken.getTime() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_MS',
          ),
        ),
    );

    // Expires RefreshToken for Cookie
    const expiresRefreshToken = new Date();

    expiresRefreshToken.setMilliseconds(
      expiresRefreshToken.getTime() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_MS',
          ),
        ),
    );

    const tokenPayload: TokenPayload = {
      userId: user.id,
      organizationIds: user.organizationIds,
      roleIds: user.roleIds,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
    });

    // Speicherung RefreshToken in DB
    await this.usersService.update({
      id: user.id,
      refreshToken: await hash(refreshToken, 10),
    });

    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresAccessToken,
    });

    response.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresRefreshToken,
    });
  }
}
