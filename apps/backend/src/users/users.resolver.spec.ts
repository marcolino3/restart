import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { Persona } from '@/common/enums/persona.enum';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  const usersService = { findCurrentUser: jest.fn() };
  const em = { query: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: usersService },
        { provide: getEntityManagerToken(), useValue: em },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('authContext', () => {
    const baseToken: TokenPayload = {
      sub: 'user-1',
      orgId: 'org-1',
      membershipId: 'membership-1',
      persona: Persona.EMPLOYEE,
      roles: ['EMPLOYEE'],
      permissions: ['PROJECT_READ'],
      isSuperAdmin: false,
    };

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

      const result = await resolver.authContext(baseToken);

      expect(result.timeTrackingEnabled).toBe(true);
      expect(result.isProjectMember).toBe(true);
      // Multi-tenant isolation: both lookups must be scoped to membership + org.
      for (const call of em.query.mock.calls) {
        expect(call[1]).toEqual(['membership-1', 'org-1']);
      }
    });

    it('defaults both flags to false when the DB has no matching rows', async () => {
      em.query.mockResolvedValue([]);

      const result = await resolver.authContext(baseToken);

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

      const result = await resolver.authContext(baseToken);

      expect(result.roles).toEqual(['EMPLOYEE']);
      expect(result.permissions).toEqual(['PROJECT_READ']);
      expect(result.orgId).toBe('org-1');
      expect(result.persona).toBe(Persona.EMPLOYEE);
      expect(result.isSuperAdmin).toBe(false);
    });
  });
});
