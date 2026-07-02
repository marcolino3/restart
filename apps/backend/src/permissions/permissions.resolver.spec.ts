import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';
import {
  guardsOf,
  overrideAllAuthGuards,
} from '@/common/testing/auth-test.util';

describe('PermissionsResolver', () => {
  let resolver: PermissionsResolver;
  let permissionsService: { findAll: jest.Mock };

  beforeEach(async () => {
    permissionsService = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          PermissionsResolver,
          { provide: PermissionsService, useValue: permissionsService },
        ],
      }),
    ).compile();

    resolver = module.get<PermissionsResolver>(PermissionsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('keeps the resolver behind the auth + access guards', () => {
    expect(guardsOf(PermissionsResolver)).toHaveLength(2);
  });

  it('findAll delegates to the service', async () => {
    await resolver.findAll();
    expect(permissionsService.findAll).toHaveBeenCalledTimes(1);
  });
});
