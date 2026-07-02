import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Persona } from '@/common/enums/persona.enum';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: Record<string, jest.Mock>;
  let em: { query: jest.Mock };

  const tokenPayload: TokenPayload = {
    sub: 'user-1',
    orgId: 'org-1',
    membershipId: 'mem-1',
    persona: Persona.EMPLOYEE,
    roles: ['ADMIN'],
    permissions: ['EMPLOYEE_WRITE'],
    isSuperAdmin: false,
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findCurrentUser: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    em = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: usersService },
        { provide: EntityManager, useValue: em },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('currentUser', () => {
    it('resolves the user from the session token payload (sub)', async () => {
      const user = { id: 'user-1' };
      usersService.findCurrentUser.mockResolvedValue(user);

      const result = await resolver.currentUser(tokenPayload);

      expect(usersService.findCurrentUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });
  });

  describe('authContext', () => {
    it('surfaces the active orgId / roles / permissions from the token payload', async () => {
      const user = { id: 'user-1' };
      usersService.findCurrentUser.mockResolvedValue(user);

      const result = await resolver.authContext(tokenPayload);

      expect(result).toEqual({
        user,
        roles: ['ADMIN'],
        permissions: ['EMPLOYEE_WRITE'],
        orgId: 'org-1',
        persona: Persona.EMPLOYEE,
        isSuperAdmin: false,
      });
    });

    it('defaults roles/permissions to empty arrays without an active org', async () => {
      const user = { id: 'user-1' };
      usersService.findCurrentUser.mockResolvedValue(user);

      const result = await resolver.authContext({
        sub: 'user-1',
        isSuperAdmin: true,
      });

      expect(result).toEqual({
        user,
        roles: [],
        permissions: [],
        orgId: undefined,
        persona: undefined,
        isSuperAdmin: true,
      });
    });

    it('throws NotFoundException when the user no longer exists', async () => {
      usersService.findCurrentUser.mockResolvedValue(null);

      await expect(resolver.authContext(tokenPayload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('CRUD delegation', () => {
    it('createUser delegates to the service', () => {
      const input = {
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        isActive: true,
        organizationId: 'org-1',
        persona: Persona.EMPLOYEE,
        roleIds: [],
      };
      resolver.createUser(input);
      expect(usersService.create).toHaveBeenCalledWith(input);
    });

    it('findAll delegates to the service', () => {
      resolver.findAll();
      expect(usersService.findAll).toHaveBeenCalled();
    });

    it('findOne delegates with the given id', () => {
      resolver.findOne('user-2');
      expect(usersService.findOne).toHaveBeenCalledWith('user-2');
    });

    it('updateUser delegates to the service', () => {
      const input = { id: 'user-1', firstName: 'Moritz' };
      resolver.updateUser(input);
      expect(usersService.update).toHaveBeenCalledWith(input);
    });

    it('removeUser delegates to the service', () => {
      resolver.removeUser('user-1');
      expect(usersService.remove).toHaveBeenCalledWith('user-1');
    });
  });

  describe('authUserIdByUserId', () => {
    it('returns the better-auth user id resolved via shared email', async () => {
      em.query.mockResolvedValue([{ id: 'ba-user-1' }]);

      const result = await resolver.authUserIdByUserId('user-1');

      expect(em.query).toHaveBeenCalledWith(expect.any(String), ['user-1']);
      expect(result).toBe('ba-user-1');
    });

    it('returns null when no better-auth user matches', async () => {
      em.query.mockResolvedValue([]);

      await expect(resolver.authUserIdByUserId('user-x')).resolves.toBeNull();
    });
  });
});
