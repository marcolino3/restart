import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager, MoreThan } from 'typeorm';

import { AuthService } from './auth.service';
import { UsersService } from '@/users/users.service';
import { MailService } from '@/mail/mail.service';
import { User } from '@/users/entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-token'),
}));
import { compare } from 'bcrypt';
const compareMock = compare as jest.Mock;

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('random-hex-token'),
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('hashed-magic-token'),
    }),
  }),
}));

// Mock getAuthContext
jest.mock('./utils/get-auth-context.util', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    user: { id: 'user-1' },
    org: { id: 'org-1' },
    membership: { id: 'mem-1', persona: 'ADMIN' },
    roles: [{ systemCode: 'ORG_ADMIN' }],
    permissions: ['users.read'],
  }),
}));

// ── helpers ────────────────────────────────────────────────────────
const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@example.com',
    passwordHash: 'hashed-pw',
    isSuperAdmin: false,
    isActive: true,
    refreshToken: 'hashed-refresh',
    magicLinkToken: null,
    magicLinkExpiresAt: null,
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let em: Record<string, jest.Mock>;
  let configService: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;
  let usersService: Record<string, jest.Mock>;
  let mailService: Record<string, jest.Mock>;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('development'),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_TOKEN_SECRET: 'access-secret',
          JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
          JWT_ACCESS_TOKEN_EXPIRATION_MS: '900000',
          JWT_REFRESH_TOKEN_EXPIRATION_MS: '604800000',
          AUTH_UI_REDIRECT: 'http://localhost:4000',
          NODE_ENV: 'development',
        };
        return map[key] ?? key;
      }),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    usersService = {
      findOneByEmail: jest.fn(),
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
      clearRefreshToken: jest.fn().mockResolvedValue(undefined),
      setMagicLinkToken: jest.fn().mockResolvedValue(undefined),
      clearMagicLinkToken: jest.fn().mockResolvedValue(undefined),
    };

    mailService = {
      sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EntityManager, useValue: em },
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ── verifyUser ───────────────────────────────────────────────────
  describe('verifyUser', () => {
    it('should return safe user when credentials are valid', async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);
      compareMock.mockResolvedValue(true);

      const result = await service.verifyUser('Max@Example.com', 'password');
      expect(em.findOne).toHaveBeenCalledWith(User, {
        where: { email: 'max@example.com', isActive: true },
        select: [
          'id',
          'firstName',
          'lastName',
          'email',
          'passwordHash',
          'isSuperAdmin',
        ],
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'max@example.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(
        service.verifyUser('nobody@test.com', 'pw'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      em.findOne.mockResolvedValue(mockUser());
      compareMock.mockResolvedValue(false);

      await expect(
        service.verifyUser('max@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no passwordHash', async () => {
      em.findOne.mockResolvedValue(mockUser({ passwordHash: undefined as any }));
      await expect(
        service.verifyUser('max@example.com', 'pw'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── verifyUserRefreshToken ───────────────────────────────────────
  describe('verifyUserRefreshToken', () => {
    it('should return user when refresh token matches', async () => {
      const user = mockUser({ refreshToken: 'hashed-refresh' });
      em.findOne.mockResolvedValue(user);
      compareMock.mockResolvedValue(true);

      const result = await service.verifyUserRefreshToken(
        'raw-refresh',
        'user-1',
      );
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when no user found', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(
        service.verifyUserRefreshToken('token', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token does not match', async () => {
      em.findOne.mockResolvedValue(mockUser({ refreshToken: 'hash' }));
      compareMock.mockResolvedValue(false);

      await expect(
        service.verifyUserRefreshToken('wrong-token', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── sendMagicLink ────────────────────────────────────────────────
  describe('sendMagicLink', () => {
    it('should generate token, store hash, and send email', async () => {
      const user = mockUser();
      usersService.findOneByEmail.mockResolvedValue(user);

      await service.sendMagicLink('max@example.com');

      expect(usersService.setMagicLinkToken).toHaveBeenCalledWith(
        'user-1',
        'hashed-magic-token',
        expect.any(Date),
      );
      expect(mailService.sendMagicLinkEmail).toHaveBeenCalledWith(
        'max@example.com',
        'Max',
        expect.stringContaining('random-hex-token'),
      );
    });

    it('should silently return when email does not exist (no leak)', async () => {
      usersService.findOneByEmail.mockRejectedValue(new Error('Not found'));

      await expect(
        service.sendMagicLink('nonexistent@test.com'),
      ).resolves.toBeUndefined();
      expect(mailService.sendMagicLinkEmail).not.toHaveBeenCalled();
    });
  });

  // ── verifyMagicLink ──────────────────────────────────────────────
  describe('verifyMagicLink', () => {
    it('should return user and clear token on valid magic link', async () => {
      const user = mockUser({
        magicLinkToken: 'hashed-magic-token',
        magicLinkExpiresAt: new Date(Date.now() + 60000),
      });
      em.findOne.mockResolvedValue(user);

      const result = await service.verifyMagicLink('raw-token');
      expect(result).toEqual(user);
      expect(usersService.clearMagicLinkToken).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException for invalid/expired token', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.verifyMagicLink('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── logout ───────────────────────────────────────────────────────
  describe('logout', () => {
    it('should clear refresh token and cookies', async () => {
      const res = {
        clearCookie: jest.fn(),
      } as any;

      await service.logout('user-1', res);

      expect(usersService.clearRefreshToken).toHaveBeenCalledWith('user-1');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'Authentication',
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'Refresh',
        expect.any(Object),
      );
    });
  });
});
