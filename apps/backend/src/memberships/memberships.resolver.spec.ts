import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsResolver } from './memberships.resolver';
import { MembershipsService } from './memberships.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CreateMembershipInput } from './dto/create-membership.input';
import { UpdateMembershipInput } from './dto/update-membership.input';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

describe('MembershipsResolver', () => {
  let resolver: MembershipsResolver;
  let membershipsService: {
    create: jest.Mock;
    update: jest.Mock;
    findByOrgId: jest.Mock;
    updateMyTheme: jest.Mock;
  };

  beforeEach(async () => {
    membershipsService = {
      create: jest.fn().mockResolvedValue({ id: 'mem-1' }),
      update: jest.fn().mockResolvedValue({ id: 'mem-1' }),
      findByOrgId: jest.fn().mockResolvedValue([]),
      updateMyTheme: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsResolver,
        { provide: MembershipsService, useValue: membershipsService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<MembershipsResolver>(MembershipsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createMembership', () => {
    it('delegates to the service with the given input', async () => {
      const input = {
        userId: 'user-1',
        organizationId: 'org-1',
      } as CreateMembershipInput;

      await expect(resolver.createMembership(input)).resolves.toEqual({
        id: 'mem-1',
      });
      expect(membershipsService.create).toHaveBeenCalledWith(input);
    });
  });

  describe('findByOrgId (membershipsByOrgId)', () => {
    it('queries memberships for the given organization only', async () => {
      const memberships = [{ id: 'mem-1' }, { id: 'mem-2' }];
      membershipsService.findByOrgId.mockResolvedValue(memberships);

      await expect(resolver.findByOrgId('org-1')).resolves.toEqual(memberships);
      expect(membershipsService.findByOrgId).toHaveBeenCalledWith('org-1');
      expect(membershipsService.findByOrgId).toHaveBeenCalledTimes(1);
    });

    // NOTE (multi-tenant): the resolver forwards a caller-supplied
    // organizationId argument instead of the session's active org
    // (@CurrentOrgId). Isolation currently relies on the caller passing
    // their own org — see report for the flagged production gap.
    it('forwards the organizationId argument unchanged to the service', async () => {
      await resolver.findByOrgId('org-other');
      expect(membershipsService.findByOrgId).toHaveBeenCalledWith('org-other');
    });
  });

  describe('updateMembership', () => {
    it('delegates to the service with the given input', async () => {
      const input = {
        id: 'mem-1',
        contactPhone: '+41791234567',
      } as UpdateMembershipInput;

      await resolver.updateMembership(input);
      expect(membershipsService.update).toHaveBeenCalledWith(input);
    });
  });

  describe('updateMyTheme', () => {
    it('scopes the update to the caller session (own membership + active org)', async () => {
      const user = {
        sub: 'user-1',
        membershipId: 'mem-1',
        orgId: 'org-1',
      } as TokenPayload;

      await expect(
        resolver.updateMyTheme(user, { theme: 'lagune' }),
      ).resolves.toBe(true);
      // Multi-tenant isolation: all ids come from the session token, never
      // from client arguments.
      expect(membershipsService.updateMyTheme).toHaveBeenCalledWith(
        { userId: 'user-1', membershipId: 'mem-1', organizationId: 'org-1' },
        'lagune',
      );
    });

    it('passes callers without membership through (SuperAdmin → user fallback)', async () => {
      const user = { sub: 'user-1', isSuperAdmin: true } as TokenPayload;

      await expect(
        resolver.updateMyTheme(user, { theme: 'lagune' }),
      ).resolves.toBe(true);
      expect(membershipsService.updateMyTheme).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          membershipId: undefined,
          organizationId: undefined,
        },
        'lagune',
      );
    });
  });
});
