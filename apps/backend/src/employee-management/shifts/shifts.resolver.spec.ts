import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsResolver } from './shifts.resolver';
import { ShiftsService } from './shifts.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';

describe('ShiftsResolver', () => {
  let resolver: ShiftsResolver;
  let service: jest.Mocked<
    Pick<
      ShiftsService,
      | 'findAll'
      | 'findForTeam'
      | 'create'
      | 'update'
      | 'remove'
      | 'setTeamShifts'
      | 'teamIdsByShift'
    >
  >;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([]),
      findForTeam: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockResolvedValue(true),
      setTeamShifts: jest.fn().mockResolvedValue([]),
      teamIdsByShift: jest.fn().mockResolvedValue(new Map([['s1', ['t1']]])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsResolver,
        { provide: ShiftsService, useValue: service },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(ShiftsResolver);
  });

  const permissionsOf = (method: keyof ShiftsResolver): string[] =>
    (Reflect.getMetadata(
      PERMS_KEY,
      (ShiftsResolver.prototype as unknown as Record<string, object>)[method],
    ) as string[] | undefined) ?? [];

  it('guards writes with SHIFT_MANAGE and reads with TIMESHEET_READ', () => {
    expect(permissionsOf('createShift')).toEqual(['SHIFT_MANAGE']);
    expect(permissionsOf('updateShift')).toEqual(['SHIFT_MANAGE']);
    expect(permissionsOf('deleteShift')).toEqual(['SHIFT_MANAGE']);
    expect(permissionsOf('setTeamShifts')).toEqual(['SHIFT_MANAGE']);
    expect(permissionsOf('shifts')).toEqual(['TIMESHEET_READ']);
    expect(permissionsOf('teamShifts')).toEqual(['TIMESHEET_READ']);
  });

  it('passes the active organization to every service call', async () => {
    await resolver.shifts('org-1');
    await resolver.teamShifts('t1', 'org-1');
    await resolver.createShift(
      { name: 'Früh', startTime: '07:00', endTime: '12:00' },
      'org-1',
    );
    await resolver.updateShift({ id: 's1', name: 'X' }, 'org-1');
    await resolver.deleteShift('s1', 'org-1');
    await resolver.setTeamShifts({ teamId: 't1', shiftIds: ['s1'] }, 'org-1');

    expect(service.findAll).toHaveBeenCalledWith('org-1');
    expect(service.findForTeam).toHaveBeenCalledWith('t1', 'org-1');
    expect(service.create).toHaveBeenCalledWith(expect.anything(), 'org-1');
    expect(service.update).toHaveBeenCalledWith(expect.anything(), 'org-1');
    expect(service.remove).toHaveBeenCalledWith('s1', 'org-1');
    expect(service.setTeamShifts).toHaveBeenCalledWith(
      expect.anything(),
      'org-1',
    );
  });

  it('resolves teamIds within the caller org only', async () => {
    const ids = await resolver.teamIds({ id: 's1' } as never, 'org-1');
    expect(service.teamIdsByShift).toHaveBeenCalledWith(['s1'], 'org-1');
    expect(ids).toEqual(['t1']);
  });
});
