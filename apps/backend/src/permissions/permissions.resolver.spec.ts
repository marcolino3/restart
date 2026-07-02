import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';

describe('PermissionsResolver', () => {
  let resolver: PermissionsResolver;
  let permissionsService: { findAll: jest.Mock };

  beforeEach(async () => {
    permissionsService = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsResolver,
        { provide: PermissionsService, useValue: permissionsService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<PermissionsResolver>(PermissionsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll (permissions)', () => {
    // Permissions are a global (non org-scoped) catalog of permission
    // codes — there is intentionally no org filter here.
    it('delegates to the service and returns its result', async () => {
      const permissions = [
        { id: 'p1', code: 'ADDRESS_READ' },
        { id: 'p2', code: 'ADDRESS_WRITE' },
      ];
      permissionsService.findAll.mockResolvedValue(permissions);

      await expect(resolver.findAll()).resolves.toEqual(permissions);
      expect(permissionsService.findAll).toHaveBeenCalledTimes(1);
      expect(permissionsService.findAll).toHaveBeenCalledWith();
    });
  });
});
