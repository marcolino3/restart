import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { Membership } from '@/memberships/entities/membership.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { TeamAccessService } from '@/employee-management/teams/team-access.service';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Shift } from '@/employee-management/shifts/entities/shift.entity';
import { TeamShift } from '@/employee-management/shifts/entities/team-shift.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { EmployeeAbsenceDay } from '@/employee-management/employee-absences/entities/employee-absence-days.entity';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { CompanyVacationAssignment } from '@/employee-management/company-vacation-assignments/entities/company-vacation-assignment.entity';
import { ShiftCoverageRequirement } from './entities/shift-coverage-requirement.entity';
import { ShiftPlan } from './entities/shift-plan.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { ShiftPlanStatus } from './entities/shift-plan-enums';
import {
  contractAllowsShiftOn,
  ShiftPlansService,
} from './shift-plans.service';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';
const TEAM = 'team-1';

const admin = {
  orgId: ORG,
  membershipId: 'm-admin',
  roles: ['ORG_ADMIN'],
} as unknown as TokenPayload;
const lead = {
  orgId: ORG,
  membershipId: 'm-lead',
  roles: ['TEAM_LEAD'],
} as unknown as TokenPayload;
const member = {
  orgId: ORG,
  membershipId: 'm-member',
  roles: ['EMPLOYEE'],
} as unknown as TokenPayload;

type Repo = Record<string, jest.Mock>;
const repo = (over: Partial<Repo> = {}): Repo => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn((d: unknown) => d),
  save: jest.fn((d: unknown) => Promise.resolve(d)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  query: jest.fn().mockResolvedValue([{ id: TEAM }]),
  ...over,
});

const contract = (over: Partial<EmployeeContract> = {}): EmployeeContract =>
  ({
    id: 'c1',
    organizationId: ORG,
    employeeId: 'e1',
    startDate: '2026-01-01',
    endDate: null,
    worksShifts: true,
    shiftWeekdays: [],
    shiftPreferences: [],
    weekdayWorkloads: null,
    weekdayTimeWindows: null,
    ...over,
  }) as unknown as EmployeeContract;

describe('ShiftPlansService', () => {
  let service: ShiftPlansService;
  let teamRepo: Repo;
  let planRepo: Repo;
  let assignmentRepo: Repo;
  let coverageRepo: Repo;
  let teamShiftRepo: Repo;
  let teamMemberRepo: Repo;
  let contractRepo: Repo;
  let absenceDayRepo: Repo;
  let holidayRepo: Repo;
  let membershipRepo: Repo;
  let teamAccess: { getEffectiveTeamRoles: jest.Mock };

  beforeEach(async () => {
    teamRepo = repo({
      findOne: jest.fn(({ where }: { where: Team }) =>
        Promise.resolve(
          where.id === TEAM && where.organizationId === ORG
            ? ({ id: TEAM, organizationId: ORG, name: 'Betreuung' } as Team)
            : null,
        ),
      ),
    });
    planRepo = repo();
    assignmentRepo = repo();
    coverageRepo = repo();
    teamShiftRepo = repo({
      find: jest.fn().mockResolvedValue([{ shiftId: 's1' }]),
      findOne: jest.fn().mockResolvedValue({ shiftId: 's1' }),
    });
    teamMemberRepo = repo({
      find: jest
        .fn()
        .mockResolvedValue([{ employeeId: 'e1' }, { employeeId: 'e2' }]),
    });
    contractRepo = repo();
    absenceDayRepo = repo();
    holidayRepo = repo();
    membershipRepo = repo({
      findOne: jest.fn(({ where }: { where: Membership }) =>
        Promise.resolve(
          where.organizationId !== ORG
            ? null
            : where.id === 'm-lead'
              ? { id: 'm-lead', employeeId: 'lead-emp' }
              : where.id === 'm-member'
                ? { id: 'm-member', employeeId: 'e2' }
                : null,
        ),
      ),
    });
    teamAccess = {
      getEffectiveTeamRoles: jest.fn((_org: string, employeeId: string) =>
        Promise.resolve(
          employeeId === 'lead-emp'
            ? [{ teamId: TEAM, role: 'LEAD' }]
            : employeeId === 'e2'
              ? [{ teamId: TEAM, role: 'MEMBER' }]
              : [],
        ),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftPlansService,
        {
          provide: getRepositoryToken(ShiftCoverageRequirement),
          useValue: coverageRepo,
        },
        { provide: getRepositoryToken(ShiftPlan), useValue: planRepo },
        {
          provide: getRepositoryToken(ShiftAssignment),
          useValue: assignmentRepo,
        },
        { provide: getRepositoryToken(Team), useValue: teamRepo },
        { provide: getRepositoryToken(TeamShift), useValue: teamShiftRepo },
        { provide: getRepositoryToken(Shift), useValue: repo() },
        { provide: getRepositoryToken(TeamMember), useValue: teamMemberRepo },
        { provide: getRepositoryToken(Employee), useValue: repo() },
        {
          provide: getRepositoryToken(EmployeeContract),
          useValue: contractRepo,
        },
        {
          provide: getRepositoryToken(EmployeeAbsenceDay),
          useValue: absenceDayRepo,
        },
        { provide: getRepositoryToken(Holiday), useValue: holidayRepo },
        { provide: getRepositoryToken(CompanyVacation), useValue: repo() },
        {
          provide: getRepositoryToken(CompanyVacationAssignment),
          useValue: repo(),
        },
        { provide: getRepositoryToken(Membership), useValue: membershipRepo },
        { provide: TeamAccessService, useValue: teamAccess },
      ],
    }).compile();
    service = module.get(ShiftPlansService);
  });

  describe('tenant isolation', () => {
    it('rejects a team of another org even for admins', async () => {
      await expect(
        service.coverageForTeam(admin, OTHER_ORG, TEAM),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.setCoverage(OTHER_ORG, { teamId: TEAM, rows: [] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('looks plans up with the caller org', async () => {
      await expect(
        service.planDetail(admin, OTHER_ORG, 'p1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(planRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'p1', organizationId: OTHER_ORG },
      });
    });
  });

  describe('lead scoping', () => {
    it('lets admins plan any team, leads their own, members nothing', async () => {
      planRepo.count.mockResolvedValue(0);
      const input = {
        teamId: TEAM,
        startDate: '2026-09-07',
        endDate: '2026-09-13',
      };
      await expect(
        service.createPlan(admin, ORG, input),
      ).resolves.toMatchObject({
        teamId: TEAM,
        status: ShiftPlanStatus.DRAFT,
      });
      await expect(service.createPlan(lead, ORG, input)).resolves.toMatchObject(
        {
          createdByMembershipId: 'm-lead',
        },
      );
      await expect(
        service.createPlan(member, ORG, input),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('denies a lead of another team', async () => {
      teamAccess.getEffectiveTeamRoles.mockResolvedValue([
        { teamId: 'team-9', role: 'LEAD' },
      ]);
      await expect(
        service.coverageForTeam(lead, ORG, TEAM),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('hides draft plans from members but shows published ones', async () => {
      planRepo.findOne.mockResolvedValue({
        id: 'p1',
        organizationId: ORG,
        teamId: TEAM,
        status: ShiftPlanStatus.DRAFT,
        startDate: '2026-09-07',
        endDate: '2026-09-08',
      });
      await expect(
        service.planDetail(member, ORG, 'p1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      planRepo.findOne.mockResolvedValue({
        id: 'p1',
        organizationId: ORG,
        teamId: TEAM,
        status: ShiftPlanStatus.PUBLISHED,
        startDate: '2026-09-07',
        endDate: '2026-09-08',
      });
      const detail = await service.planDetail(member, ORG, 'p1');
      expect(detail.candidates).toEqual([]);
    });

    it('lists only published plans of member teams without teamId', async () => {
      await service.listPlans(member, ORG, null);
      expect(planRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ShiftPlanStatus.PUBLISHED }),
        }),
      );
    });

    it('flags plannable teams with write access', async () => {
      teamRepo.find.mockResolvedValue([
        { id: TEAM, name: 'Betreuung' },
        { id: 'team-9', name: 'Other' },
      ]);
      await expect(service.plannableTeams(lead, ORG)).resolves.toEqual([
        { id: TEAM, name: 'Betreuung', canWrite: true },
      ]);
      await expect(service.plannableTeams(member, ORG)).resolves.toEqual([
        { id: TEAM, name: 'Betreuung', canWrite: false },
      ]);
      const all = await service.plannableTeams(admin, ORG);
      expect(all).toHaveLength(2);
      expect(all.every((t) => t.canWrite)).toBe(true);
    });
  });

  describe('coverage', () => {
    it('replaces rows, drops zero counts and rejects foreign shifts', async () => {
      const rows = await service.setCoverage(ORG, {
        teamId: TEAM,
        rows: [
          { shiftId: 's1', weekday: 'mon', requiredCount: 2 },
          { shiftId: 's1', weekday: 'tue', requiredCount: 0 },
        ],
      });
      expect(coverageRepo.delete).toHaveBeenCalledWith({
        organizationId: ORG,
        teamId: TEAM,
      });
      expect(coverageRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          weekday: 'mon',
          requiredCount: 2,
          organizationId: ORG,
        }),
      ]);
      expect(rows).toEqual([]);

      await expect(
        service.setCoverage(ORG, {
          teamId: TEAM,
          rows: [{ shiftId: 's-foreign', weekday: 'mon', requiredCount: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('plans', () => {
    it('rejects overlapping plans of the same team', async () => {
      planRepo.count.mockResolvedValue(1);
      await expect(
        service.createPlan(admin, ORG, {
          teamId: TEAM,
          startDate: '2026-09-07',
          endDate: '2026-09-13',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('candidates', () => {
    it('applies contract weekdays, absences and holidays', async () => {
      contractRepo.find.mockResolvedValue([
        contract({ employeeId: 'e1', shiftWeekdays: ['mon', 'tue'] }),
        contract({
          id: 'c2',
          employeeId: 'e2',
          startDate: '2026-09-09',
          weekdayWorkloads: { wed: 50, thu: 50 },
        }),
      ]);
      absenceDayRepo.find.mockResolvedValue([
        { employeeId: 'e1', date: new Date('2026-09-08T00:00:00Z') },
      ]);
      holidayRepo.find.mockResolvedValue([
        { date: '2020-09-10', repeatsYearly: true },
      ]);

      const candidates = await service.computeCandidates(
        ORG,
        TEAM,
        '2026-09-07',
        '2026-09-13',
      );
      // e1: mon+tue, tue absent -> mon only
      expect(
        candidates.find((c) => c.employeeId === 'e1')?.availableDates,
      ).toEqual(['2026-09-07']);
      // e2: contract from wed, working days wed+thu, thu is holiday -> wed only
      expect(
        candidates.find((c) => c.employeeId === 'e2')?.availableDates,
      ).toEqual(['2026-09-09']);
      expect(teamMemberRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG,
            isActive: true,
          }),
        }),
      );
    });

    it('skips members without a shift-work contract', async () => {
      contractRepo.find.mockResolvedValue([]);
      await expect(
        service.computeCandidates(ORG, TEAM, '2026-09-07', '2026-09-07'),
      ).resolves.toEqual([]);
    });
  });

  describe('assignments', () => {
    beforeEach(() => {
      planRepo.findOne.mockResolvedValue({
        id: 'p1',
        organizationId: ORG,
        teamId: TEAM,
        status: ShiftPlanStatus.DRAFT,
        startDate: '2026-09-07',
        endDate: '2026-09-13',
      });
      contractRepo.find.mockResolvedValue([contract({ employeeId: 'e1' })]);
    });

    it('replaces a cell with available employees', async () => {
      await service.setAssignments(lead, ORG, {
        planId: 'p1',
        date: '2026-09-07',
        shiftId: 's1',
        employeeIds: ['e1', 'e1'],
      });
      expect(assignmentRepo.delete).toHaveBeenCalledWith({
        organizationId: ORG,
        planId: 'p1',
        date: '2026-09-07',
        shiftId: 's1',
      });
      expect(assignmentRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ employeeId: 'e1', organizationId: ORG }),
      ]);
    });

    it('rejects unavailable employees, foreign shifts and dates outside the plan', async () => {
      await expect(
        service.setAssignments(lead, ORG, {
          planId: 'p1',
          date: '2026-09-07',
          shiftId: 's1',
          employeeIds: ['e2'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      teamShiftRepo.findOne.mockResolvedValue(null);
      await expect(
        service.setAssignments(lead, ORG, {
          planId: 'p1',
          date: '2026-09-07',
          shiftId: 's9',
          employeeIds: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.setAssignments(lead, ORG, {
          planId: 'p1',
          date: '2026-10-01',
          shiftId: 's1',
          employeeIds: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('members cannot assign or publish', async () => {
      await expect(
        service.setAssignments(member, ORG, {
          planId: 'p1',
          date: '2026-09-07',
          shiftId: 's1',
          employeeIds: [],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.setStatus(member, ORG, 'p1', ShiftPlanStatus.PUBLISHED),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns only published assignments of the caller', async () => {
      await service.myAssignments(member, ORG, '2026-09-07', '2026-09-13');
      expect(assignmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: ORG,
            employeeId: 'e2',
            plan: { status: ShiftPlanStatus.PUBLISHED },
          }),
        }),
      );
    });
  });

  describe('contractAllowsShiftOn', () => {
    it('falls back to working days, then to every day', () => {
      expect(
        contractAllowsShiftOn(
          contract({ shiftWeekdays: ['fri'] }),
          '2026-09-11',
        ),
      ).toBe(true);
      expect(
        contractAllowsShiftOn(
          contract({ shiftWeekdays: ['fri'] }),
          '2026-09-10',
        ),
      ).toBe(false);
      expect(
        contractAllowsShiftOn(
          contract({ weekdayWorkloads: { mon: 100 } }),
          '2026-09-08',
        ),
      ).toBe(false);
      expect(contractAllowsShiftOn(contract(), '2026-09-13')).toBe(true);
      expect(
        contractAllowsShiftOn(contract({ worksShifts: false }), '2026-09-07'),
      ).toBe(false);
    });
  });
});
