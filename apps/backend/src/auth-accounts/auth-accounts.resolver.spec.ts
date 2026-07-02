import { Test, TestingModule } from '@nestjs/testing';

import { AuthAccountsResolver } from './auth-accounts.resolver';
import { AuthAccountsService } from './auth-accounts.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { AuthProvider } from './interfaces/auth-provider.enum';

describe('AuthAccountsResolver', () => {
  let resolver: AuthAccountsResolver;
  let service: { findByUserEmailId: jest.Mock };

  beforeEach(async () => {
    service = {
      findByUserEmailId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthAccountsResolver,
        { provide: AuthAccountsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<AuthAccountsResolver>(AuthAccountsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findByUserEmailId', () => {
    it('delegates to the service with the given userEmailId', async () => {
      const accounts = [
        {
          id: 'aa-1',
          userEmailId: 'ue-1',
          provider: AuthProvider.GOOGLE,
          providerId: 'google-123',
        },
      ];
      service.findByUserEmailId.mockResolvedValue(accounts);

      await expect(resolver.findByUserEmailId('ue-1')).resolves.toBe(accounts);
      expect(service.findByUserEmailId).toHaveBeenCalledWith('ue-1');
    });

    it('returns an empty list when the user email has no linked providers', async () => {
      service.findByUserEmailId.mockResolvedValue([]);

      await expect(resolver.findByUserEmailId('ue-none')).resolves.toEqual([]);
    });
  });
});
