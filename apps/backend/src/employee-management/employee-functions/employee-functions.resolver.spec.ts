import { Test, TestingModule } from '@nestjs/testing';

import { Locale } from '@/database/enums/locale.enum';
import { EmployeeFunctionsResolver } from './employee-functions.resolver';
import { EmployeeFunctionsService } from './employee-functions.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { ADMIN_PERSONA_KEY } from '@/auth/decorators/admin-persona-only.decorator';

const methodOf = (name: keyof EmployeeFunctionsResolver): object =>
  Object.getOwnPropertyDescriptor(EmployeeFunctionsResolver.prototype, name)
    ?.value as object;

describe('EmployeeFunctionsResolver', () => {
  let resolver: EmployeeFunctionsResolver;
  let service: {
    findAllByOrgId: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
    remove: jest.Mock;
    reorder: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAllByOrgId: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      remove: jest.fn(),
      reorder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeFunctionsResolver,
        { provide: EmployeeFunctionsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(EmployeeFunctionsResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', EmployeeFunctionsResolver) ?? [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it('requires admin persona for the whole resolver', () => {
    const adminPersonaOnly =
      Reflect.getMetadata(ADMIN_PERSONA_KEY, EmployeeFunctionsResolver) ??
      false;
    expect(adminPersonaOnly).toBe(true);
  });

  it.each([
    ['findAll', 'EMPLOYEE_READ'],
    ['findOne', 'EMPLOYEE_READ'],
    ['createEmployeeFunction', 'EMPLOYEE_WRITE'],
    ['updateEmployeeFunction', 'EMPLOYEE_WRITE'],
    ['archiveEmployeeFunction', 'EMPLOYEE_WRITE'],
    ['deleteEmployeeFunction', 'EMPLOYEE_WRITE'],
    ['reorderEmployeeFunctions', 'EMPLOYEE_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  it('passes the active org id from the session to the service (multi-tenant isolation)', async () => {
    service.findAllByOrgId.mockResolvedValue([]);

    await resolver.findAll('org-a');

    expect(service.findAllByOrgId).toHaveBeenCalledWith('org-a', false);
  });

  it('scopes mutations to the active org id', async () => {
    service.create.mockResolvedValue({ id: 'fn-1' });

    await resolver.createEmployeeFunction(
      {
        translations: [{ locale: Locale.DE, name: 'Lehrperson' }],
      },
      'org-a',
    );

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        translations: expect.arrayContaining([
          expect.objectContaining({ name: 'Lehrperson' }),
        ]),
      }),
      'org-a',
    );
  });

  it('scopes findOne to the active org id', async () => {
    service.findOne.mockResolvedValue({ id: 'fn-1' });

    await resolver.findOne('fn-1', 'org-b');

    expect(service.findOne).toHaveBeenCalledWith('fn-1', 'org-b');
  });
});
