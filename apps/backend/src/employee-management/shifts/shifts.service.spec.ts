import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ShiftsService, toHHMM } from './shifts.service';
import { Shift } from './entities/shift.entity';
import { TeamShift } from './entities/team-shift.entity';
import { Team } from '../teams/entities/team.entity';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';

type FindArgs = { where: Record<string, unknown> };

const shift = (over: Partial<Shift> = {}): Shift =>
  ({
    id: 's1',
    organizationId: ORG,
    name: 'Früh',
    startTime: '07:00:00',
    endTime: '12:00:00',
    color: null,
    sortOrder: 0,
    breaks: [],
    isActive: true,
    ...over,
  }) as Shift;

describe('ShiftsService', () => {
  let service: ShiftsService;
  let shiftsRepo: jest.Mocked<
    Pick<Repository<Shift>, 'findOne' | 'find' | 'create' | 'save' | 'count'>
  >;
  let teamShiftsRepo: jest.Mocked<
    Pick<Repository<TeamShift>, 'find' | 'create' | 'save' | 'delete'>
  >;
  let teamsRepo: jest.Mocked<Pick<Repository<Team>, 'findOne'>>;

  beforeEach(async () => {
    shiftsRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((d: Partial<Shift>) => d as Shift),
      save: jest.fn((s: Shift) => Promise.resolve(s)),
      count: jest.fn().mockResolvedValue(0),
    } as unknown as typeof shiftsRepo;
    teamShiftsRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((d: Partial<TeamShift>) => d as TeamShift),
      save: jest.fn((rows: TeamShift[]) => Promise.resolve(rows)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    } as unknown as typeof teamShiftsRepo;
    teamsRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: getRepositoryToken(Shift), useValue: shiftsRepo },
        { provide: getRepositoryToken(TeamShift), useValue: teamShiftsRepo },
        { provide: getRepositoryToken(Team), useValue: teamsRepo },
      ],
    }).compile();

    service = module.get(ShiftsService);
  });

  it('normalises Postgres time values to HH:MM', () => {
    expect(toHHMM('07:30:00')).toBe('07:30');
    expect(toHHMM('07:30')).toBe('07:30');
  });

  describe('findAll / findOne', () => {
    it('filters by organization and returns HH:MM times', async () => {
      shiftsRepo.find.mockResolvedValue([shift()]);
      const result = await service.findAll(ORG);
      expect(shiftsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG, isActive: true },
        }),
      );
      expect(result[0].startTime).toBe('07:00');
      expect(result[0].endTime).toBe('12:00');
    });

    it('does not find a shift of another organization', async () => {
      shiftsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('s1', OTHER_ORG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(shiftsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 's1', organizationId: OTHER_ORG, isActive: true },
      });
    });
  });

  describe('create', () => {
    it('creates an org-scoped shift with the next sort order', async () => {
      shiftsRepo.findOne
        .mockResolvedValueOnce(null) // name clash lookup
        .mockResolvedValueOnce(shift({ sortOrder: 4 })); // last by sortOrder

      await service.create(
        { name: ' Spät ', startTime: '12:00', endTime: '18:00' },
        ORG,
      );

      expect(shiftsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Spät',
          organizationId: ORG,
          startTime: '12:00',
          endTime: '18:00',
          sortOrder: 5,
        }),
      );
    });

    it('rejects a duplicate active name within the org', async () => {
      shiftsRepo.findOne.mockResolvedValue(shift());
      await expect(
        service.create(
          { name: 'Früh', startTime: '07:00', endTime: '12:00' },
          ORG,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('re-activates a soft-deleted shift with the same name', async () => {
      shiftsRepo.findOne.mockResolvedValue(shift({ isActive: false }));
      const result = await service.create(
        { name: 'Früh', startTime: '06:00', endTime: '11:00' },
        ORG,
      );
      expect(result.isActive).toBe(true);
      expect(result.startTime).toBe('06:00');
      expect(shiftsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects updating a shift owned by another organization', async () => {
      shiftsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update({ id: 's1', name: 'X' }, OTHER_ORG),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(shiftsRepo.save).not.toHaveBeenCalled();
    });

    it('clears the color when null is passed', async () => {
      shiftsRepo.findOne.mockResolvedValue(shift({ color: '#ff0000' }));
      const result = await service.update({ id: 's1', color: null }, ORG);
      expect(result.color).toBeNull();
    });
  });

  describe('remove', () => {
    it('soft-deletes and drops team assignments in the same org', async () => {
      shiftsRepo.findOne.mockResolvedValue(shift());
      await service.remove('s1', ORG);
      expect(shiftsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 's1', isActive: false }),
      );
      expect(teamShiftsRepo.delete).toHaveBeenCalledWith({
        shiftId: 's1',
        organizationId: ORG,
      });
    });
  });

  describe('setTeamShifts', () => {
    it('rejects a team from another organization', async () => {
      teamsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.setTeamShifts({ teamId: 't1', shiftIds: ['s1'] }, OTHER_ORG),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(teamsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 't1', organizationId: OTHER_ORG, isActive: true },
      });
      expect(teamShiftsRepo.save).not.toHaveBeenCalled();
    });

    it('rejects shift ids that are not all in the organization', async () => {
      teamsRepo.findOne.mockResolvedValue({ id: 't1' } as Team);
      shiftsRepo.count.mockResolvedValue(1); // only one of two found
      await expect(
        service.setTeamShifts(
          { teamId: 't1', shiftIds: ['s1', 'foreign'] },
          ORG,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(teamShiftsRepo.save).not.toHaveBeenCalled();
    });

    it('diffs the current set: removes stale rows, adds new ones', async () => {
      teamsRepo.findOne.mockResolvedValue({ id: 't1' } as Team);
      shiftsRepo.count.mockResolvedValue(2);
      teamShiftsRepo.find
        .mockResolvedValueOnce([
          { id: 'ts-old', teamId: 't1', shiftId: 's-old' } as TeamShift,
          { id: 'ts-keep', teamId: 't1', shiftId: 's-keep' } as TeamShift,
        ])
        .mockResolvedValueOnce([]); // findForTeam after write

      await service.setTeamShifts(
        { teamId: 't1', shiftIds: ['s-keep', 's-new', 's-new'] },
        ORG,
      );

      expect(teamShiftsRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: ORG }),
      );
      const deleteArg = teamShiftsRepo.delete.mock.calls[0][0] as FindArgs;
      expect(JSON.stringify(deleteArg)).toContain('ts-old');
      expect(teamShiftsRepo.create).toHaveBeenCalledTimes(1);
      expect(teamShiftsRepo.create).toHaveBeenCalledWith({
        teamId: 't1',
        shiftId: 's-new',
        organizationId: ORG,
      });
    });
  });

  describe('findForTeam', () => {
    it('only returns active shifts, sorted by sortOrder then start time', async () => {
      teamsRepo.findOne.mockResolvedValue({ id: 't1' } as Team);
      teamShiftsRepo.find.mockResolvedValue([
        { shift: shift({ id: 'b', sortOrder: 1, startTime: '12:00:00' }) },
        { shift: shift({ id: 'x', isActive: false }) },
        { shift: shift({ id: 'a', sortOrder: 1, startTime: '07:00:00' }) },
      ] as TeamShift[]);

      const result = await service.findForTeam('t1', ORG);
      expect(result.map((s) => s.id)).toEqual(['a', 'b']);
      expect(teamShiftsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId: 't1', organizationId: ORG },
        }),
      );
    });
  });
});
