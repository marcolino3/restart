import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PasswordService } from './password.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

// ── helpers ────────────────────────────────────────────────────────
const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@example.com',
    username: 'max',
    passwordHash: 'hashed-password',
    isActive: true,
    isSuperAdmin: false,
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;
  let em: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let passwordService: Record<string, jest.Mock>;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn((_, data) => ({ id: 'new-user', ...data })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ id: 'new-user', ...entity }),
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOneByOrFail: jest.fn(),
      transaction: jest.fn((cb: (m: any) => any) => cb(em)),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    passwordService = {
      generateRandomPasswordHash: jest
        .fn()
        .mockResolvedValue('random-hashed-pw'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: EntityManager, useValue: em },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PasswordService, useValue: passwordService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  // ── create ───────────────────────────────────────────────────────
  describe('create', () => {
    it('should create user with hashed password', async () => {
      em.findOne.mockResolvedValue(null); // no email conflict

      const result = await service.create({
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'Max@Example.com',
        password: 'secret123',
        isActive: true,
      });

      expect(em.create).toHaveBeenCalledWith(User, {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        username: undefined,
        passwordHash: 'hashed-password',
      });
      expect(em.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should generate random password when none provided', async () => {
      em.findOne.mockResolvedValue(null);

      await service.create({
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        isActive: true,
      });

      expect(passwordService.generateRandomPasswordHash).toHaveBeenCalledWith(
        12,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      em.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.create({
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max@example.com',
          password: 'pw',
          isActive: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize email to lowercase', async () => {
      em.findOne.mockResolvedValue(null);

      await service.create({
        firstName: 'Max',
        lastName: 'Mustermann',
        email: '  MAX@EXAMPLE.COM  ',
        password: 'pw',
        isActive: true,
      });

      expect(em.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({ email: 'max@example.com' }),
      );
    });
  });

  // ── findOne ──────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return user by id', async () => {
      const user = mockUser();
      em.findOneBy.mockResolvedValue(user);

      const result = await service.findOne('user-1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException for missing user', async () => {
      em.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findOneByEmail ───────────────────────────────────────────────
  describe('findOneByEmail', () => {
    it('should find user case-insensitively', async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);

      const result = await service.findOneByEmail('MAX@EXAMPLE.COM');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException for unknown email', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(
        service.findOneByEmail('nobody@test.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAll ──────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser(), mockUser({ id: 'user-2' })];
      em.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  // ── findCurrentUser ──────────────────────────────────────────────
  describe('findCurrentUser', () => {
    it('should return user with memberships relation', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findCurrentUser('user-1');
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['memberships'],
      });
      expect(result).toEqual(user);
    });
  });

  // ── update ───────────────────────────────────────────────────────
  describe('update', () => {
    it('should update user fields', async () => {
      const updated = mockUser({ firstName: 'Moritz' });
      em.findOne.mockResolvedValue(null); // no email conflict
      em.findOneBy.mockResolvedValue(updated);

      const result = await service.update({ id: 'user-1', firstName: 'Moritz' });
      expect(em.update).toHaveBeenCalled();
      expect(result.firstName).toBe('Moritz');
    });

    it('should throw ConflictException on email conflict', async () => {
      em.findOne.mockResolvedValue({ id: 'other-user' }); // conflict

      await expect(
        service.update({ id: 'user-1', email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── setRefreshToken / clearRefreshToken ──────────────────────────
  describe('token management', () => {
    it('should set refresh token hash', async () => {
      await service.setRefreshToken('user-1', 'new-hash');
      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { refreshToken: 'new-hash' },
      );
    });

    it('should clear refresh token', async () => {
      await service.clearRefreshToken('user-1');
      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { refreshToken: null },
      );
    });
  });

  // ── magic link token management ──────────────────────────────────
  describe('magic link token management', () => {
    it('should set magic link token and expiry', async () => {
      const expiry = new Date();
      await service.setMagicLinkToken('user-1', 'token-hash', expiry);
      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { magicLinkToken: 'token-hash', magicLinkExpiresAt: expiry },
      );
    });

    it('should clear magic link token', async () => {
      await service.clearMagicLinkToken('user-1');
      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { magicLinkToken: null, magicLinkExpiresAt: null },
      );
    });
  });

  // ── remove ───────────────────────────────────────────────────────
  describe('remove', () => {
    it('should deactivate user (soft delete)', async () => {
      await service.remove('user-1');
      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { isActive: false },
      );
    });
  });
});
