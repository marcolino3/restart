import { Test, TestingModule } from '@nestjs/testing';
import { AuthAccountsResolver } from './auth-accounts.resolver';
import { AuthAccountsService } from './auth-accounts.service';

describe('AuthAccountsResolver', () => {
  let resolver: AuthAccountsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAccountsResolver, AuthAccountsService],
    }).compile();

    resolver = module.get<AuthAccountsResolver>(AuthAccountsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
