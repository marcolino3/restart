import { Test, TestingModule } from '@nestjs/testing';

import { AuthAccountsResolver } from './auth-accounts.resolver';
import { AuthAccountsService } from './auth-accounts.service';
import { AuthAccount } from './entities/auth-account.entity';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import {
  overrideAllAuthGuards,
  guardsOf,
  methodOf,
} from '@/common/testing/auth-test.util';

describe('AuthAccountsResolver', () => {
  let resolver: AuthAccountsResolver;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      findByUserEmailId: jest.fn(),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          AuthAccountsResolver,
          { provide: AuthAccountsService, useValue: service },
        ],
      }),
    ).compile();

    resolver = module.get<AuthAccountsResolver>(AuthAccountsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findByUserEmailId', () => {
    it('delegates to the service with the given userEmailId', async () => {
      const accounts = [{ id: 'aa-1' }] as AuthAccount[];
      service.findByUserEmailId.mockResolvedValue(accounts);

      const result = await resolver.findByUserEmailId('ue-1');

      expect(service.findByUserEmailId).toHaveBeenCalledWith('ue-1');
      expect(result).toBe(accounts);
    });
  });

  describe('auth wiring', () => {
    it('gates the resolver behind auth + access guards', () => {
      const guards = guardsOf(AuthAccountsResolver);
      expect(guards).toContain(GqlBetterAuthGuard);
      expect(guards).toContain(GraphQLAccessGuard);
    });

    it('exposes findByUserEmailId as a query handler', () => {
      expect(methodOf(AuthAccountsResolver, 'findByUserEmailId')).toBeDefined();
    });
  });
});
