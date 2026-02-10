import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsResolver } from './memberships.resolver';
import { MembershipsService } from './memberships.service';

describe('MembershipsResolver', () => {
  let resolver: MembershipsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsResolver, MembershipsService],
    }).compile();

    resolver = module.get<MembershipsResolver>(MembershipsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
