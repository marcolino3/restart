import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { SetupStatusResolver } from './setup-status.resolver';
import { SetupStatusService } from './setup-status.service';

const ORG_ID = 'org-1';

// Prototype-Methoden ohne Member-Access referenzieren (unbound-method-Regel)
const methodOf = (name: keyof SetupStatusResolver): object =>
  Object.getOwnPropertyDescriptor(SetupStatusResolver.prototype, name)
    ?.value as object;

describe('SetupStatusResolver', () => {
  let resolver: SetupStatusResolver;
  let service: { getStatus: jest.Mock };

  beforeEach(async () => {
    service = { getStatus: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetupStatusResolver,
        { provide: SetupStatusService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(SetupStatusResolver);
  });

  it('scopes the status to the active organization', async () => {
    const status = { complete: false, requiredRemaining: 2, steps: [] };
    service.getStatus.mockResolvedValue(status);

    await expect(resolver.getSetupStatus(ORG_ID)).resolves.toBe(status);
    expect(service.getStatus).toHaveBeenCalledWith(ORG_ID);
  });

  it('restricts the query to admin-capable roles', () => {
    const handler = methodOf('getSetupStatus');
    const roles: SystemRole[] = Reflect.getMetadata(ROLES_KEY, handler) ?? [];

    expect(roles).toEqual([
      SystemRole.ORG_OWNER,
      SystemRole.ORG_ADMIN,
      SystemRole.HR_MANAGER,
      SystemRole.OFFICE,
    ]);
    expect(roles).not.toContain(SystemRole.EMPLOYEE);
    expect(roles).not.toContain(SystemRole.TEAM_LEAD);
  });

  it('keeps the auth guards on the resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', SetupStatusResolver) ?? [];

    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });
});
