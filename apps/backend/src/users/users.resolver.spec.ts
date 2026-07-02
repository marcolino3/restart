import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';

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
    membershipId: 'membership-1',
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
        { provide: getEntityManagerToken(), useValue: em },
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
    beforeEach(() => {
      usersService.findCurrentUser.mockResolvedValue({ id: 'user-1' });
    });

    it('surfaces timeTrackingEnabled and isProjectMember from the DB', async () => {
      em.query.mockImplementation((sql: string) => {
        if (sql.includes('time_tracking_enabled')) {
          return Promise.resolve([{ enabled: true }]);
        }
        return Promise.resolve([{ is_member: true }]);
      });

      const result = await resolver.authContext(tokenPayload);

      expect(result.timeTrackingEnabled).toBe(true);
      expect(result.isProjectMember).toBe(true);
      // Multi-tenant isolation: both lookups must be scoped to membership + org.
      for (const call of em.query.mock.calls) {
        expect(call[1]).toEqual(['membership-1', 'org-1']);
      }
    });

    it('defaults both flags to false when the DB has no matching rows', async () => {
      em.query.mockResolvedValue([]);

      const result = await resolver.authContext(tokenPayload);

      expect(result.timeTrackingEnabled).toBe(false);
      expect(result.isProjectMember).toBe(false);
    });

    it('skips DB lookups and returns false flags without membership/org (SuperAdmin ohne Org)', async () => {
      const result = await resolver.authContext({
        sub: 'user-1',
        isSuperAdmin: true,
      });

      expect(result.timeTrackingEnabled).toBe(false);
      expect(result.isProjectMember).toBe(false);
      expect(em.query).not.toHaveBeenCalled();
    });

    it('passes token roles, permissions, persona and org through', async () => {
      em.query.mockResolvedValue([]);

      const result = await resolver.authContext(tokenPayload);

      expect(result.roles).toEqual(['ADMIN']);
      expect(result.permissions).toEqual(['EMPLOYEE_WRITE']);
      expect(result.orgId).toBe('org-1');
      expect(result.persona).toBe(Persona.EMPLOYEE);
      expect(result.isSuperAdmin).toBe(false);
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
