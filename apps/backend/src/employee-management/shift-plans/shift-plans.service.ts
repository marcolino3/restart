import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Membership } from '@/memberships/entities/membership.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { TeamAccessService } from '@/employee-management/teams/team-access.service';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { TeamMemberRole } from '@/employee-management/team-members/entities/team-member-role.enum';
import { Shift } from '@/employee-management/shifts/entities/shift.entity';
import { TeamShift } from '@/employee-management/shifts/entities/team-shift.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import {
  contractWorkingDays,
  WEEKDAY_KEYS,
} from '@/employee-management/employee-contracts/contract-shifts';
import { EmployeeAbsenceDay } from '@/employee-management/employee-absences/entities/employee-absence-days.entity';
import { EmployeeAbsenceStatus } from '@/employee-management/employee-absences/entities/employee-absence-status.enum';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { CompanyVacationAssignment } from '@/employee-management/company-vacation-assignments/entities/company-vacation-assignment.entity';
import { ShiftCoverageRequirement } from './entities/shift-coverage-requirement.entity';
import { ShiftPlan } from './entities/shift-plan.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { ShiftPlanSource, ShiftPlanStatus } from './entities/shift-plan-enums';
import {
  ShiftPlanCandidate,
  ShiftPlanDetail,
  ShiftPlanEmployee,
  ShiftPlanTeam,
} from './entities/shift-plan-detail.type';
import { SetShiftCoverageInput } from './dto/set-shift-coverage.input';
import { CreateShiftPlanInput } from './dto/create-shift-plan.input';
import { SetShiftAssignmentsInput } from './dto/set-shift-assignments.input';
import { datesBetween, isoDateOf, weekdayOf } from './shift-plan-dates';

/** Org roles that may plan every team. Leads are scoped to their own teams. */
const PLAN_ADMIN_ROLES: ReadonlySet<string> = new Set<string>([
  SystemRole.ORG_OWNER,
  SystemRole.ORG_ADMIN,
  SystemRole.HR_MANAGER,
]);

/** Caller's relation to a team, from strongest to weakest. */
export type TeamPlanRole = 'ADMIN' | 'LEAD' | 'MEMBER';

const MAX_TEAM_DEPTH = 10;

@Injectable()
export class ShiftPlansService {
  constructor(
    @InjectRepository(ShiftCoverageRequirement)
    private readonly coverageRepo: Repository<ShiftCoverageRequirement>,
    @InjectRepository(ShiftPlan)
    private readonly planRepo: Repository<ShiftPlan>,
    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamShift)
    private readonly teamShiftRepo: Repository<TeamShift>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeContract)
    private readonly contractRepo: Repository<EmployeeContract>,
    @InjectRepository(EmployeeAbsenceDay)
    private readonly absenceDayRepo: Repository<EmployeeAbsenceDay>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(CompanyVacation)
    private readonly companyVacationRepo: Repository<CompanyVacation>,
    @InjectRepository(CompanyVacationAssignment)
    private readonly companyVacationAssignmentRepo: Repository<CompanyVacationAssignment>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly teamAccess: TeamAccessService,
  ) {}

  // ---- access ----------------------------------------------------------

  private isPlanAdmin(user: TokenPayload): boolean {
    return (
      !!user.isSuperAdmin || !!user.roles?.some((r) => PLAN_ADMIN_ROLES.has(r))
    );
  }

  private async callerEmployeeId(
    user: TokenPayload,
    organizationId: string,
  ): Promise<string | null> {
    if (!user.membershipId) return null;
    const m = await this.membershipRepo.findOne({
      where: { id: user.membershipId, organizationId },
      select: { id: true, employeeId: true },
    });
    return m?.employeeId ?? null;
  }

  /** Team must belong to the org; returns the caller's role or null. */
  async resolveTeamRole(
    user: TokenPayload,
    organizationId: string,
    teamId: string,
  ): Promise<{ team: Team; role: TeamPlanRole | null }> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (this.isPlanAdmin(user)) return { team, role: 'ADMIN' };

    const employeeId = await this.callerEmployeeId(user, organizationId);
    if (!employeeId) return { team, role: null };
    const roles = await this.teamAccess.getEffectiveTeamRoles(
      organizationId,
      employeeId,
    );
    const role = roles.find((r) => r.teamId === teamId)?.role;
    if (!role) return { team, role: null };
    return { team, role: role === TeamMemberRole.LEAD ? 'LEAD' : 'MEMBER' };
  }

  private async assertTeamAccess(
    user: TokenPayload,
    organizationId: string,
    teamId: string,
    mode: 'read' | 'write',
  ): Promise<{ team: Team; role: TeamPlanRole }> {
    const { team, role } = await this.resolveTeamRole(
      user,
      organizationId,
      teamId,
    );
    if (!role) throw new ForbiddenException('No access to this team');
    if (mode === 'write' && role === 'MEMBER') {
      throw new ForbiddenException('Only team leads may plan this team');
    }
    return { team, role };
  }

  /** Teams the caller may look at plans for, flagged with write access. */
  async plannableTeams(
    user: TokenPayload,
    organizationId: string,
  ): Promise<ShiftPlanTeam[]> {
    const teams = await this.teamRepo.find({
      where: { organizationId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (this.isPlanAdmin(user)) {
      return teams.map((t) => ({ id: t.id, name: t.name, canWrite: true }));
    }
    const employeeId = await this.callerEmployeeId(user, organizationId);
    if (!employeeId) return [];
    const roles = await this.teamAccess.getEffectiveTeamRoles(
      organizationId,
      employeeId,
    );
    const byTeam = new Map(roles.map((r) => [r.teamId, r.role]));
    return teams
      .filter((t) => byTeam.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        canWrite: byTeam.get(t.id) === TeamMemberRole.LEAD,
      }));
  }

  // ---- coverage --------------------------------------------------------

  async coverageForTeam(
    user: TokenPayload,
    organizationId: string,
    teamId: string,
  ): Promise<ShiftCoverageRequirement[]> {
    await this.assertTeamAccess(user, organizationId, teamId, 'read');
    return this.coverageRepo.find({
      where: { organizationId, teamId },
      order: { weekday: 'ASC' },
    });
  }

  /** Full replacement of a team's requirements. SHIFT_MANAGE only (org-wide). */
  async setCoverage(
    organizationId: string,
    input: SetShiftCoverageInput,
  ): Promise<ShiftCoverageRequirement[]> {
    const team = await this.teamRepo.findOne({
      where: { id: input.teamId, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');

    const teamShiftIds = new Set(
      (
        await this.teamShiftRepo.find({
          where: { organizationId, teamId: team.id },
          select: { shiftId: true },
        })
      ).map((ts) => ts.shiftId),
    );

    const seen = new Set<string>();
    const rows: ShiftCoverageRequirement[] = [];
    for (const row of input.rows) {
      if (!teamShiftIds.has(row.shiftId)) {
        throw new BadRequestException(
          `Shift "${row.shiftId}" is not assigned to this team`,
        );
      }
      const key = `${row.shiftId}:${row.weekday}`;
      if (seen.has(key)) {
        throw new BadRequestException(`Duplicate row for ${key}`);
      }
      seen.add(key);
      if (row.requiredCount <= 0) continue;
      rows.push(
        this.coverageRepo.create({
          organizationId,
          teamId: team.id,
          shiftId: row.shiftId,
          weekday: row.weekday,
          requiredCount: row.requiredCount,
        }),
      );
    }

    await this.coverageRepo.delete({ organizationId, teamId: team.id });
    if (rows.length > 0) await this.coverageRepo.save(rows);
    return this.coverageRepo.find({
      where: { organizationId, teamId: team.id },
      order: { weekday: 'ASC' },
    });
  }

  // ---- plans -----------------------------------------------------------

  async listPlans(
    user: TokenPayload,
    organizationId: string,
    teamId?: string | null,
  ): Promise<ShiftPlan[]> {
    if (teamId) {
      const { role } = await this.assertTeamAccess(
        user,
        organizationId,
        teamId,
        'read',
      );
      return this.planRepo.find({
        where:
          role === 'MEMBER'
            ? { organizationId, teamId, status: ShiftPlanStatus.PUBLISHED }
            : { organizationId, teamId },
        order: { startDate: 'DESC' },
      });
    }
    if (this.isPlanAdmin(user)) {
      return this.planRepo.find({
        where: { organizationId },
        order: { startDate: 'DESC' },
      });
    }
    const employeeId = await this.callerEmployeeId(user, organizationId);
    if (!employeeId) return [];
    const roles = await this.teamAccess.getEffectiveTeamRoles(
      organizationId,
      employeeId,
    );
    const leadTeams = roles
      .filter((r) => r.role === TeamMemberRole.LEAD)
      .map((r) => r.teamId);
    const memberTeams = roles
      .filter((r) => r.role !== TeamMemberRole.LEAD)
      .map((r) => r.teamId);
    const [lead, member] = await Promise.all([
      leadTeams.length
        ? this.planRepo.find({
            where: { organizationId, teamId: In(leadTeams) },
          })
        : [],
      memberTeams.length
        ? this.planRepo.find({
            where: {
              organizationId,
              teamId: In(memberTeams),
              status: ShiftPlanStatus.PUBLISHED,
            },
          })
        : [],
    ]);
    return [...lead, ...member].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
  }

  async createPlan(
    user: TokenPayload,
    organizationId: string,
    input: CreateShiftPlanInput,
  ): Promise<ShiftPlan> {
    const { team } = await this.assertTeamAccess(
      user,
      organizationId,
      input.teamId,
      'write',
    );
    datesBetween(input.startDate, input.endDate); // validates order + length

    const overlapping = await this.planRepo.count({
      where: {
        organizationId,
        teamId: team.id,
        startDate: LessThanOrEqual(input.endDate),
        endDate: MoreThanOrEqual(input.startDate),
      },
    });
    if (overlapping > 0) {
      throw new ConflictException(
        'A plan for this team already covers part of the period',
      );
    }

    return this.planRepo.save(
      this.planRepo.create({
        organizationId,
        teamId: team.id,
        startDate: input.startDate,
        endDate: input.endDate,
        status: ShiftPlanStatus.DRAFT,
        source: ShiftPlanSource.MANUAL,
        createdByMembershipId: user.membershipId ?? null,
      }),
    );
  }

  private async loadPlan(
    user: TokenPayload,
    organizationId: string,
    planId: string,
    mode: 'read' | 'write',
  ): Promise<{ plan: ShiftPlan; role: TeamPlanRole }> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, organizationId },
    });
    if (!plan) throw new NotFoundException('Shift plan not found');
    const { role } = await this.assertTeamAccess(
      user,
      organizationId,
      plan.teamId,
      mode,
    );
    if (role === 'MEMBER' && plan.status !== ShiftPlanStatus.PUBLISHED) {
      throw new NotFoundException('Shift plan not found');
    }
    return { plan, role };
  }

  async planDetail(
    user: TokenPayload,
    organizationId: string,
    planId: string,
  ): Promise<ShiftPlanDetail> {
    const { plan, role } = await this.loadPlan(
      user,
      organizationId,
      planId,
      'read',
    );
    const [shifts, coverage, assignments] = await Promise.all([
      this.shiftsOfTeam(organizationId, plan.teamId),
      this.coverageRepo.find({
        where: { organizationId, teamId: plan.teamId },
      }),
      this.assignmentRepo.find({
        where: { organizationId, planId: plan.id },
        order: { date: 'ASC' },
      }),
    ]);
    const candidates =
      role === 'MEMBER'
        ? []
        : await this.computeCandidates(
            organizationId,
            plan.teamId,
            plan.startDate,
            plan.endDate,
          );
    const employeeIds = new Set<string>([
      ...candidates.map((c) => c.employeeId),
      ...assignments.map((a) => a.employeeId),
    ]);
    const employees = await this.employeeNames(employeeIds);
    for (const c of candidates) {
      const e = employees.find((x) => x.employeeId === c.employeeId);
      c.firstName = e?.firstName ?? null;
      c.lastName = e?.lastName ?? null;
    }
    return { plan, shifts, coverage, assignments, employees, candidates };
  }

  async setAssignments(
    user: TokenPayload,
    organizationId: string,
    input: SetShiftAssignmentsInput,
  ): Promise<ShiftAssignment[]> {
    const { plan } = await this.loadPlan(
      user,
      organizationId,
      input.planId,
      'write',
    );
    if (input.date < plan.startDate || input.date > plan.endDate) {
      throw new BadRequestException('Date is outside the plan period');
    }
    const teamShift = await this.teamShiftRepo.findOne({
      where: { organizationId, teamId: plan.teamId, shiftId: input.shiftId },
    });
    if (!teamShift) {
      throw new BadRequestException('Shift is not assigned to this team');
    }

    const employeeIds = [...new Set(input.employeeIds)];
    if (employeeIds.length > 0) {
      const candidates = await this.computeCandidates(
        organizationId,
        plan.teamId,
        input.date,
        input.date,
      );
      const available = new Set(
        candidates
          .filter((c) => c.availableDates.includes(input.date))
          .map((c) => c.employeeId),
      );
      const blocked = employeeIds.filter((id) => !available.has(id));
      if (blocked.length > 0) {
        throw new BadRequestException(
          `Not available on ${input.date}: ${blocked.join(', ')}`,
        );
      }
    }

    await this.assignmentRepo.delete({
      organizationId,
      planId: plan.id,
      date: input.date,
      shiftId: input.shiftId,
    });
    if (employeeIds.length > 0) {
      await this.assignmentRepo.save(
        employeeIds.map((employeeId) =>
          this.assignmentRepo.create({
            organizationId,
            planId: plan.id,
            date: input.date,
            shiftId: input.shiftId,
            employeeId,
          }),
        ),
      );
    }
    await this.planRepo.update({ id: plan.id }, { updatedAt: new Date() });
    return this.assignmentRepo.find({
      where: { organizationId, planId: plan.id },
      order: { date: 'ASC' },
    });
  }

  async setStatus(
    user: TokenPayload,
    organizationId: string,
    planId: string,
    status: ShiftPlanStatus,
  ): Promise<ShiftPlan> {
    const { plan } = await this.loadPlan(user, organizationId, planId, 'write');
    plan.status = status;
    return this.planRepo.save(plan);
  }

  async deletePlan(
    user: TokenPayload,
    organizationId: string,
    planId: string,
  ): Promise<boolean> {
    const { plan } = await this.loadPlan(user, organizationId, planId, 'write');
    await this.planRepo.delete({ id: plan.id, organizationId });
    return true;
  }

  /** Published assignments of the caller in a date range (employee view). */
  async myAssignments(
    user: TokenPayload,
    organizationId: string,
    from: string,
    to: string,
  ): Promise<ShiftAssignment[]> {
    datesBetween(from, to);
    const employeeId = await this.callerEmployeeId(user, organizationId);
    if (!employeeId) return [];
    return this.assignmentRepo.find({
      where: {
        organizationId,
        employeeId,
        date: Between(from, to),
        plan: { status: ShiftPlanStatus.PUBLISHED },
      },
      relations: { shift: true, plan: true },
      order: { date: 'ASC' },
    });
  }

  // ---- candidates ------------------------------------------------------

  private async shiftsOfTeam(
    organizationId: string,
    teamId: string,
  ): Promise<Shift[]> {
    const links = await this.teamShiftRepo.find({
      where: { organizationId, teamId },
      select: { shiftId: true },
    });
    if (links.length === 0) return [];
    return this.shiftRepo.find({
      where: { organizationId, id: In(links.map((l) => l.shiftId)) },
      order: { sortOrder: 'ASC', startTime: 'ASC' },
    });
  }

  private async descendantTeamIds(
    organizationId: string,
    teamId: string,
  ): Promise<string[]> {
    const rows: Array<{ id: string }> = await this.teamRepo.query(
      `
      WITH RECURSIVE tree AS (
        SELECT t.id, 1 AS lvl FROM teams t
        WHERE t.id = $1 AND t.organization_id = $2
        UNION ALL
        SELECT c.id, tree.lvl + 1 FROM teams c
        JOIN tree ON c.parent_id = tree.id
        WHERE c.organization_id = $2 AND c."isActive" = true
          AND tree.lvl < ${MAX_TEAM_DEPTH}
      )
      SELECT id FROM tree
      `,
      [teamId, organizationId],
    );
    return rows.map((r) => r.id);
  }

  private async employeeNames(
    employeeIds: Set<string>,
  ): Promise<ShiftPlanEmployee[]> {
    if (employeeIds.size === 0) return [];
    const employees = await this.employeeRepo.find({
      where: { id: In([...employeeIds]) },
      relations: { membership: { user: true } },
    });
    return employees.map((e) => ({
      employeeId: e.id,
      firstName: e.membership?.user?.firstName ?? null,
      lastName: e.membership?.user?.lastName ?? null,
    }));
  }

  /**
   * Candidates for a team and period. Pure data assembly; the per-day rule is
   * `isAvailable`. Names are filled in by the caller.
   */
  async computeCandidates(
    organizationId: string,
    teamId: string,
    startDate: string,
    endDate: string,
  ): Promise<ShiftPlanCandidate[]> {
    const dates = datesBetween(startDate, endDate);
    const teamIds = await this.descendantTeamIds(organizationId, teamId);
    const members = await this.teamMemberRepo.find({
      where: { organizationId, teamId: In(teamIds), isActive: true },
      select: { employeeId: true },
    });
    const employeeIds = [...new Set(members.map((m) => m.employeeId))];
    if (employeeIds.length === 0) return [];

    const [contracts, absenceDays, holidays, vacations] = await Promise.all([
      this.contractRepo.find({
        where: {
          organizationId,
          employeeId: In(employeeIds),
          worksShifts: true,
          startDate: LessThanOrEqual(endDate),
        },
      }),
      this.absenceDayRepo.find({
        where: {
          organizationId,
          employeeId: In(employeeIds),
          date: Between(
            new Date(`${startDate}T00:00:00Z`),
            new Date(`${endDate}T23:59:59Z`),
          ),
          employeeAbsence: { status: EmployeeAbsenceStatus.APPROVED },
        },
        relations: { employeeAbsence: true },
      }),
      this.holidayRepo.find({ where: { organizationId } }),
      this.companyVacationRepo.find({
        where: {
          organizationId,
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
        },
      }),
    ]);

    const vacationAssignments =
      vacations.length > 0
        ? await this.companyVacationAssignmentRepo.find({
            where: {
              organizationId,
              companyVacationId: In(vacations.map((v) => v.id)),
              employeeId: In(employeeIds),
            },
          })
        : [];

    const holidayDates = new Set<string>();
    for (const h of holidays) {
      const iso = isoDateOf(h.date);
      if (h.repeatsYearly) {
        for (const d of dates) {
          if (d.slice(5) === iso.slice(5)) holidayDates.add(d);
        }
      } else {
        holidayDates.add(iso);
      }
    }

    const absent = new Map<string, Set<string>>();
    for (const day of absenceDays) {
      const set = absent.get(day.employeeId) ?? new Set<string>();
      set.add(isoDateOf(day.date));
      absent.set(day.employeeId, set);
    }

    const vacationDaysByEmployee = new Map<string, Set<string>>();
    for (const va of vacationAssignments) {
      const v = vacations.find((x) => x.id === va.companyVacationId);
      if (!v) continue;
      const set =
        vacationDaysByEmployee.get(va.employeeId) ?? new Set<string>();
      const vs = isoDateOf(v.startDate);
      const ve = isoDateOf(v.endDate);
      for (const d of dates) if (d >= vs && d <= ve) set.add(d);
      vacationDaysByEmployee.set(va.employeeId, set);
    }

    const contractsByEmployee = new Map<string, EmployeeContract[]>();
    for (const c of contracts) {
      const list = contractsByEmployee.get(c.employeeId) ?? [];
      list.push(c);
      contractsByEmployee.set(c.employeeId, list);
    }

    const result: ShiftPlanCandidate[] = [];
    for (const employeeId of employeeIds) {
      const employeeContracts = contractsByEmployee.get(employeeId) ?? [];
      if (employeeContracts.length === 0) continue;
      const availableDates: string[] = [];
      let preferences = employeeContracts[0].shiftPreferences ?? [];
      for (const date of dates) {
        const contract = employeeContracts.find((c) =>
          contractActiveOn(c, date),
        );
        if (!contract) continue;
        preferences = contract.shiftPreferences ?? [];
        if (holidayDates.has(date)) continue;
        if (absent.get(employeeId)?.has(date)) continue;
        if (vacationDaysByEmployee.get(employeeId)?.has(date)) continue;
        if (!contractAllowsShiftOn(contract, date)) continue;
        availableDates.push(date);
      }
      if (availableDates.length === 0) continue;
      result.push({
        employeeId,
        firstName: null,
        lastName: null,
        availableDates,
        preferences,
      });
    }
    return result;
  }
}

export function contractActiveOn(
  contract: Pick<EmployeeContract, 'startDate' | 'endDate'>,
  isoDate: string,
): boolean {
  const start = isoDateOf(contract.startDate);
  if (start > isoDate) return false;
  const end = contract.endDate ? isoDateOf(contract.endDate) : null;
  return end === null || end >= isoDate;
}

/**
 * Shift weekdays of the contract; empty list means every working day of the
 * contract (or every day when the contract has no per-day schedule).
 */
export function contractAllowsShiftOn(
  contract: Pick<
    EmployeeContract,
    'worksShifts' | 'shiftWeekdays' | 'weekdayWorkloads' | 'weekdayTimeWindows'
  >,
  isoDate: string,
): boolean {
  if (!contract.worksShifts) return false;
  const weekday = weekdayOf(isoDate);
  const shiftDays = contract.shiftWeekdays ?? [];
  if (shiftDays.length > 0) return shiftDays.includes(weekday);
  const working = contractWorkingDays(contract);
  return working === null || working.includes(weekday);
}

export { WEEKDAY_KEYS };
