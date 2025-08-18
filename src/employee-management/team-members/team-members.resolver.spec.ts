import { Test, TestingModule } from '@nestjs/testing';
import { TeamMembersResolver } from './team-members.resolver';
import { TeamMembersService } from './team-members.service';

describe('TeamMembersResolver', () => {
  let resolver: TeamMembersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamMembersResolver, TeamMembersService],
    }).compile();

    resolver = module.get<TeamMembersResolver>(TeamMembersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
