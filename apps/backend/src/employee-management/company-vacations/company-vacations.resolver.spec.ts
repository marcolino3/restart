import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CompanyVacationsResolver } from './company-vacations.resolver';
import { CompanyVacationsService } from './company-vacations.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { ADMIN_PERSONA_KEY } from '@/auth/decorators/admin-persona-only.decorator';

const methodOf = (name: keyof CompanyVacationsResolver): object =>
  Object.getOwnPropertyDescriptor(CompanyVacationsResolver.prototype, name)
    ?.value as object;

describe('CompanyVacationsResolver', () => {
  let resolver: CompanyVacationsResolver;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyVacationsResolver,
        { provide: CompanyVacationsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(CompanyVacationsResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', CompanyVacationsResolver) ?? [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it.each([
    ['companyVacations', 'TIMESHEET_READ'],
    ['createCompanyVacation', 'EMPLOYEE_WRITE'],
    ['updateCompanyVacation', 'EMPLOYEE_WRITE'],
    ['deleteCompanyVacation', 'EMPLOYEE_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  it.each([
    'createCompanyVacation',
    'updateCompanyVacation',
    'deleteCompanyVacation',
  ] as const)('%s requires admin persona', (method) => {
    const adminPersonaOnly =
      Reflect.getMetadata(ADMIN_PERSONA_KEY, methodOf(method)) ?? false;
    expect(adminPersonaOnly).toBe(true);
  });

  it('passes the active org id to findAll (multi-tenant isolation)', async () => {
    service.findAll.mockResolvedValue([]);
    await resolver.companyVacations('org-a');
    expect(service.findAll).toHaveBeenCalledWith('org-a');
  });

  it('scopes create to the active org id', async () => {
    service.create.mockResolvedValue({ id: 'cv-1' });
    await resolver.createCompanyVacation(
      {
        name: 'Sommerferien',
        startDate: '2026-07-01',
        endDate: '2026-08-15',
      },
      'org-a',
    );
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sommerferien',
        startDate: '2026-07-01',
        endDate: '2026-08-15',
      }),
      'org-a',
    );
  });

  describe('multi-tenant isolation', () => {
    it('propagates NotFoundException for update of a foreign-org vacation', async () => {
      service.update.mockRejectedValue(
        new NotFoundException('CompanyVacation cv-foreign not found'),
      );

      await expect(
        resolver.updateCompanyVacation(
          { id: 'cv-foreign', name: 'X' },
          'org-a',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(service.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cv-foreign' }),
        'org-a',
      );
    });

    it('propagates NotFoundException for delete of a foreign-org vacation', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('CompanyVacation cv-foreign not found'),
      );

      await expect(
        resolver.deleteCompanyVacation('cv-foreign', 'org-a'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(service.remove).toHaveBeenCalledWith('cv-foreign', 'org-a');
    });

    it('scopes update and delete to the active org id', async () => {
      service.update.mockResolvedValue({ id: 'cv-1' });
      service.remove.mockResolvedValue(true);

      await resolver.updateCompanyVacation(
        { id: 'cv-1', name: 'Neu' },
        'org-a',
      );
      await resolver.deleteCompanyVacation('cv-1', 'org-a');

      expect(service.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cv-1' }),
        'org-a',
      );
      expect(service.remove).toHaveBeenCalledWith('cv-1', 'org-a');
    });
  });
});
