import { Test, TestingModule } from '@nestjs/testing';

import { GradeLevelsResolver } from './grade-levels.resolver';
import { GradeLevelsService } from './grade-levels.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

const methodOf = (name: keyof GradeLevelsResolver): object =>
  Object.getOwnPropertyDescriptor(GradeLevelsResolver.prototype, name)
    ?.value as object;

describe('GradeLevelsResolver', () => {
  let resolver: GradeLevelsResolver;
  let service: {
    findAllByOrgId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    reorder: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAllByOrgId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reorder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeLevelsResolver,
        { provide: GradeLevelsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(GradeLevelsResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', GradeLevelsResolver) ?? [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it.each([
    ['findAll', 'SCHOOL_CLASS_READ'],
    ['createGradeLevel', 'SCHOOL_CLASS_WRITE'],
    ['updateGradeLevel', 'SCHOOL_CLASS_WRITE'],
    ['deleteGradeLevel', 'SCHOOL_CLASS_DELETE'],
    ['reorderGradeLevels', 'SCHOOL_CLASS_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  it('passes the active org id from the session to the service (multi-tenant isolation)', async () => {
    service.findAllByOrgId.mockResolvedValue([]);

    await resolver.findAll('org-1');

    expect(service.findAllByOrgId).toHaveBeenCalledWith('org-1');
  });

  it('scopes mutations to the active org id', async () => {
    service.create.mockResolvedValue({ id: 'gl-1' });

    await resolver.createGradeLevel({ name: 'Unterstufe' }, 'org-1');

    expect(service.create).toHaveBeenCalledWith(
      { name: 'Unterstufe' },
      'org-1',
    );
  });
});
