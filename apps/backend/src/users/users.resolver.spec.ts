import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { Organization } from '@/organizations/entities/organization.entity';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: { findCurrentUser: jest.Mock };
  let em: { findOne: jest.Mock };

  beforeEach(async () => {
    usersService = { findCurrentUser: jest.fn() };
    em = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: usersService },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('authContext', () => {
    const baseUser = { id: 'user-1' };

    it('resolves the active organization name for an org-scoped user', async () => {
      usersService.findCurrentUser.mockResolvedValue(baseUser);
      em.findOne.mockResolvedValue({ id: 'org-1', name: 'Montessori Zürich' });

      const token = {
        sub: 'user-1',
        orgId: 'org-1',
        roles: [],
        permissions: [],
        isSuperAdmin: false,
      } as unknown as TokenPayload;

      const result = await resolver.authContext(token);

      expect(em.findOne).toHaveBeenCalledWith(
        Organization,
        expect.objectContaining({ where: { id: 'org-1' } }),
      );
      expect(result.orgId).toBe('org-1');
      expect(result.orgName).toBe('Montessori Zürich');
    });

    it('leaves orgName undefined when there is no active org (e.g. SuperAdmin)', async () => {
      usersService.findCurrentUser.mockResolvedValue(baseUser);

      const token = {
        sub: 'user-1',
        orgId: undefined,
        isSuperAdmin: true,
      } as unknown as TokenPayload;

      const result = await resolver.authContext(token);

      expect(em.findOne).not.toHaveBeenCalled();
      expect(result.orgName).toBeUndefined();
    });
  });
});
