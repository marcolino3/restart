import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { HolidaysResolver } from './holidays.resolver';
import { HolidaysService } from './holidays.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

const methodOf = (name: keyof HolidaysResolver): object =>
  Object.getOwnPropertyDescriptor(HolidaysResolver.prototype, name)
    ?.value as object;

describe('HolidaysResolver', () => {
  let resolver: HolidaysResolver;
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
        HolidaysResolver,
        { provide: HolidaysService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(HolidaysResolver);
  });

  it('authenticates the whole resolver', () => {
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', HolidaysResolver) ?? [];
    expect(guards).toEqual(
      expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
    );
  });

  it.each([
    ['holidays', 'TIMESHEET_READ'],
    ['createHoliday', 'EMPLOYEE_WRITE'],
    ['updateHoliday', 'EMPLOYEE_WRITE'],
    ['deleteHoliday', 'EMPLOYEE_WRITE'],
  ] as const)('%s requires permission %s', (method, permission) => {
    const permissions: string[] =
      Reflect.getMetadata(PERMS_KEY, methodOf(method)) ?? [];
    expect(permissions).toContain(permission);
  });

  it('passes the active org id to findAll (multi-tenant isolation)', async () => {
    service.findAll.mockResolvedValue([]);
    await resolver.holidays('org-a');
    expect(service.findAll).toHaveBeenCalledWith('org-a');
  });

  it('scopes create to the active org id', async () => {
    service.create.mockResolvedValue({ id: 'h-1' });
    await resolver.createHoliday(
      { date: '2026-08-01', name: 'Nationalfeiertag', repeatsYearly: true },
      'org-a',
    );
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-08-01',
        name: 'Nationalfeiertag',
        repeatsYearly: true,
      }),
      'org-a',
    );
  });

  describe('multi-tenant isolation', () => {
    it('propagates NotFoundException for update of a foreign-org holiday', async () => {
      service.update.mockRejectedValue(
        new NotFoundException('Holiday h-foreign not found'),
      );

      await expect(
        resolver.updateHoliday({ id: 'h-foreign', name: 'X' }, 'org-a'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(service.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'h-foreign' }),
        'org-a',
      );
    });

    it('propagates NotFoundException for delete of a foreign-org holiday', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Holiday h-foreign not found'),
      );

      await expect(
        resolver.deleteHoliday('h-foreign', 'org-a'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(service.remove).toHaveBeenCalledWith('h-foreign', 'org-a');
    });

    it('scopes update and delete to the active org id', async () => {
      service.update.mockResolvedValue({ id: 'h-1' });
      service.remove.mockResolvedValue(true);

      await resolver.updateHoliday({ id: 'h-1', name: 'Neu' }, 'org-a');
      await resolver.deleteHoliday('h-1', 'org-a');

      expect(service.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'h-1' }),
        'org-a',
      );
      expect(service.remove).toHaveBeenCalledWith('h-1', 'org-a');
    });
  });
});
