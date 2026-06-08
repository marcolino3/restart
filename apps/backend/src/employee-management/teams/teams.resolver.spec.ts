import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';
import { TeamAccessService } from './team-access.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

describe('TeamsResolver', () => {
  let resolver: TeamsResolver;
  let teamAccessService: { getAccessibleTeamsForMembership: jest.Mock };

  beforeEach(async () => {
    teamAccessService = {
      getAccessibleTeamsForMembership: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsResolver,
        { provide: TeamsService, useValue: {} },
        { provide: TeamAccessService, useValue: teamAccessService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<TeamsResolver>(TeamsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('myTeams', () => {
    it('rejects when there is no active membership', async () => {
      await expect(
        resolver.myTeams({ sub: 'u1' }, 'org-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(
        teamAccessService.getAccessibleTeamsForMembership,
      ).not.toHaveBeenCalled();
    });

    it('delegates to the access service with the current membership + org', async () => {
      await resolver.myTeams({ sub: 'u1', membershipId: 'mem-1' }, 'org-1');
      expect(
        teamAccessService.getAccessibleTeamsForMembership,
      ).toHaveBeenCalledWith('org-1', 'mem-1');
    });
  });
});
