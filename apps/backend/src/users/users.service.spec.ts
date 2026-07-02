import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Role } from '@/roles/entities/role.entity';
import { PasswordService } from './password.service';
import { UserEmailsService } from '@/user-emails/user-emails.service';
import { Persona } from '@/common/enums/persona.enum';

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
    username: 'max',
    isActive: true,
    isSuperAdmin: false,
    ...overrides,
  }) as User;

const baseCreateInput = {
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com',
  isActive: true,
  organizationId: 'org-1',
  persona: Persona.EMPLOYEE,
  roleIds: [] as string[],
};

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
      create: jest.fn((_entity, data: object) => ({ ...data })),
      save: jest
        .fn()
        .mockImplementation((entity: object) =>
          Promise.resolve({ id: 'new-user', ...entity }),
        ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findByIds: jest.fn().mockResolvedValue([]),
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
        .mockResolvedValue({ id: 'ue-1', email: 'max@example.com' }),
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
    it('should create the user inside a transaction with hashed password', async () => {
      const result = await service.create({
        ...baseCreateInput,
        password: 'secret123',
      });

      expect(em.transaction).toHaveBeenCalled();
      expect(em.create).toHaveBeenCalledWith(User, {
        title: undefined,
        firstName: 'Max',
        lastName: 'Mustermann',
        username: undefined,
        isActive: true,
      });
      // first email is created as primary + verified with the bcrypt hash
      expect(userEmailsService.create).toHaveBeenCalledWith(
        'new-user',
        'max@example.com',
        'hashed-password',
        true,
        true,
      );
      expect(result).toEqual(expect.objectContaining({ id: 'new-user' }));
    });

    it('should generate a random password when none is provided', async () => {
      await service.create(baseCreateInput);

      expect(passwordService.generateRandomPasswordHash).toHaveBeenCalledWith(
        12,
      );
      expect(userEmailsService.create).toHaveBeenCalledWith(
        'new-user',
        'max@example.com',
        'random-hashed-pw',
        true,
        true,
      );
    });

    it('should create a membership scoped to the given organization', async () => {
      await service.create({ ...baseCreateInput, organizationId: 'org-42' });

      expect(em.create).toHaveBeenCalledWith(Membership, {
        userId: 'new-user',
        organizationId: 'org-42',
        persona: Persona.EMPLOYEE,
        userEmailId: 'ue-1',
      });
    });

    it('should assign the given roles to the membership', async () => {
      const roles = [{ id: 'role-1' }, { id: 'role-2' }];
      em.findByIds.mockResolvedValue(roles);

      await service.create({
        ...baseCreateInput,
        roleIds: ['role-1', 'role-2'],
      });

      expect(em.findByIds).toHaveBeenCalledWith(Role, ['role-1', 'role-2']);
      expect(em.save).toHaveBeenCalledWith(expect.objectContaining({ roles }));
    });

    it('should propagate ConflictException when the email already exists', async () => {
      userEmailsService.create.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        service.create({ ...baseCreateInput, password: 'pw123456' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return user by id with relations', async () => {
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

    it('should throw NotFoundException for missing user', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findOneByEmail ───────────────────────────────────────────────
  describe('findOneByEmail', () => {
    it('should resolve the user via UserEmailsService', async () => {
      const user = mockUser();
      userEmailsService.findByEmail.mockResolvedValue({
        id: 'ue-1',
        userId: 'user-1',
      });
      em.findOne.mockResolvedValue(user);

      const result = await service.findOneByEmail('MAX@EXAMPLE.COM');

      expect(userEmailsService.findByEmail).toHaveBeenCalledWith(
        'MAX@EXAMPLE.COM',
      );
      expect(result).toEqual(user);
    });

    it('should propagate NotFoundException for unknown email', async () => {
      userEmailsService.findByEmail.mockRejectedValue(
        new NotFoundException('Email not found'),
      );
      await expect(service.findOneByEmail('nobody@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findAll ──────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all users with relations', async () => {
      const users = [mockUser(), mockUser({ id: 'user-2' })];
      em.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(em.find).toHaveBeenCalledWith(User, {
        relations: [
          'userEmails',
          'userEmails.authAccounts',
          'memberships',
          'memberships.organization',
        ],
      });
    });
  });

  // ── findCurrentUser ──────────────────────────────────────────────
  describe('findCurrentUser', () => {
    it('should return user with memberships + userEmails relations', async () => {
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
    it('should update user fields inside a transaction', async () => {
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
      em.findOne.mockResolvedValue(mockUser({ username: 'moritz' }));

      await service.update({ id: 'user-1', username: '  moritz  ' });

      expect(em.update).toHaveBeenCalledWith(
        User,
        { id: 'user-1' },
        { username: 'moritz' },
      );
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 'nonexistent', firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
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
