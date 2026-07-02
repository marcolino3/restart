import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PasswordService } from './password.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { Persona } from '@/common/enums/persona.enum';

// bcrypt.hash is used for password hashing on create — mock it deterministically.
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

// ── helpers ────────────────────────────────────────────────────────
const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    firstName: 'Max',
    lastName: 'Mustermann',
    username: 'max',
    isActive: true,
    isSuperAdmin: false,
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;
  let em: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let passwordService: Record<string, jest.Mock>;
  let userEmailsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((_entity, data: Record<string, unknown>) => ({
        id: 'new-user',
        ...data,
      })),
      save: jest.fn((entity: Record<string, unknown>) =>
        Promise.resolve({ id: 'new-user', ...entity }),
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findByIds: jest.fn().mockResolvedValue([]),
      // The service wraps writes in `entityManager.transaction(cb)`;
      // run the callback against the same mocked manager.
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(em)),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    passwordService = {
      generateRandomPasswordHash: jest
        .fn()
        .mockResolvedValue('random-hashed-pw'),
    };

    userEmailsService = {
      create: jest
        .fn()
        .mockResolvedValue({ id: 'ue-1', email: 'test@example.com' }),
      findByEmail: jest.fn(),
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: EntityManager, useValue: em },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PasswordService, useValue: passwordService },
        { provide: UserEmailsService, useValue: userEmailsService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  // ── create ───────────────────────────────────────────────────────
  describe('create', () => {
    it('should create the user entity and delegate the email to UserEmailsService', async () => {
      const result = await service.create({
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        password: 'secret123',
        isActive: true,
        organizationId: 'org-1',
        persona: Persona.EMPLOYEE,
        roleIds: [],
      });

      expect(em.create).toHaveBeenCalledWith(User, {
        title: undefined,
        firstName: 'Max',
        lastName: 'Mustermann',
        username: undefined,
        isActive: true,
      });
      expect(em.save).toHaveBeenCalled();
      // Email creation is delegated with the hashed password + primary/verified flags.
      expect(userEmailsService.create).toHaveBeenCalledWith(
        'new-user',
        'max@example.com',
        'hashed-password',
        true,
        true,
      );
      expect(result).toBeDefined();
    });

    it('should generate a random password hash when none is provided', async () => {
      await service.create({
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        isActive: true,
        organizationId: 'org-1',
        persona: Persona.EMPLOYEE,
        roleIds: [],
      });

      expect(passwordService.generateRandomPasswordHash).toHaveBeenCalledWith(
        12,
      );
    });

    it('should propagate a ConflictException from the email service', async () => {
      userEmailsService.create.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        service.create({
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max@example.com',
          password: 'pw',
          isActive: true,
          organizationId: 'org-1',
          persona: Persona.EMPLOYEE,
          roleIds: [],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return the user with relations', async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(em.findOne).toHaveBeenCalledWith(User, {
        where: { id: 'user-1' },
        relations: [
          'userEmails',
          'userEmails.authAccounts',
          'memberships',
          'memberships.organization',
        ],
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException for a missing user', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findOneByEmail ───────────────────────────────────────────────
  describe('findOneByEmail', () => {
    it('should resolve the user via the email lookup service', async () => {
      const user = mockUser();
      userEmailsService.findByEmail.mockResolvedValue({ userId: 'user-1' });
      em.findOne.mockResolvedValue(user);

      const result = await service.findOneByEmail('MAX@EXAMPLE.COM');

      expect(userEmailsService.findByEmail).toHaveBeenCalledWith(
        'MAX@EXAMPLE.COM',
      );
      expect(result).toEqual(user);
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
    it('should load the user with memberships and userEmails relations', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findCurrentUser('user-1');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['memberships', 'userEmails'],
      });
      expect(result).toEqual(user);
    });
  });

  // ── update ───────────────────────────────────────────────────────
  describe('update', () => {
    it('should patch fields and return the reloaded user', async () => {
      const updated = mockUser({ firstName: 'Moritz' });
      em.findOne.mockResolvedValue(updated);

      const result = await service.update({
        id: 'user-1',
        firstName: 'Moritz',
      });

      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { firstName: 'Moritz' },
      );
      expect(result.firstName).toBe('Moritz');
    });

    it('should trim the username before persisting', async () => {
      em.findOne.mockResolvedValue(mockUser());

      await service.update({ id: 'user-1', username: '  bob  ' });

      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { username: 'bob' },
      );
    });

    it('should throw NotFoundException when the user disappears after update', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'user-1', firstName: 'Moritz' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── changeUserEmail ──────────────────────────────────────────────
  describe('changeUserEmail', () => {
    it('should throw NotFoundException when the user has no email', async () => {
      em.find.mockResolvedValue([]);

      await expect(
        service.changeUserEmail('user-1', 'new@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── setRefreshToken / clearRefreshToken ──────────────────────────
  describe('token management', () => {
    it('should set the refresh token hash', async () => {
      await service.setRefreshToken('user-1', 'new-hash');

      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { refreshToken: 'new-hash' },
      );
    });

    it('should clear the refresh token', async () => {
      await service.clearRefreshToken('user-1');

      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { refreshToken: null },
      );
    });
  });

  // ── remove ───────────────────────────────────────────────────────
  describe('remove', () => {
    it('should deactivate the user (soft delete)', async () => {
      await service.remove('user-1');

      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { isActive: false },
      );
    });
  });
});
